from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import uuid
import io
import zipfile
from database.dbhandler import hash_file
from src.redaction_service import process_pdf_redaction
from src.ocr_redaction import ocr_from_pdf
from src.ollamahandler import OllamaClient
from database.models import get_db, Document

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'temp_uploads'
STORAGE_FOLDER = 'document_storage'
ALLOWED_EXTENSIONS = {'pdf'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(STORAGE_FOLDER, exist_ok=True)


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/document/add', methods=['POST'])
def add_document():
    # Check if the post request has files
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    email = request.form.get('email')

    if not email:
        return jsonify({'error': 'Email is required'}), 400

    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        temp_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(temp_path)

        # Create storage path - using UUID since hash will be added later
        file_id = str(uuid.uuid4())
        storage_filename = f"{file_id}_{filename}"
        storage_path = os.path.join(STORAGE_FOLDER, storage_filename)

        # Move file to permanent storage
        os.rename(temp_path, storage_path)

        # Save to database with NULL hash initially
        try:
            db = next(get_db())

            # Check if document with this path already exists
            existing_doc = db.query(Document).filter(
                Document.path == storage_path).first()

            if existing_doc:
                return jsonify({'error': 'Document with this path already exists'}), 409

            # Create new document record with NULL hash
            new_document = Document(
                path=storage_path,
                email=email,
                hash=None  # Hash will be updated after structured data processing
            )

            db.add(new_document)
            db.commit()

            return jsonify({
                'message': 'Document added successfully',
                'path': storage_path,
                'email': email
            })

        except Exception as e:
            db.rollback()
            # Clean up file if database operation failed
            if os.path.exists(storage_path):
                os.remove(storage_path)
            return jsonify({'error': f'Error adding document to database: {str(e)}'}), 500
        finally:
            db.close()

    return jsonify({'error': 'Invalid file type'}), 400


@app.route('/documents', methods=['GET'])
def get_documents():
    email_filter = request.args.get('email')

    try:
        db = next(get_db())
        query = db.query(Document)

        # Filter by email if provided
        if email_filter:
            query = query.filter(Document.email == email_filter)

        documents = query.all()

        result = []
        for doc in documents:
            result.append({
                'path': doc.path,
                'email': doc.email,
                'hash': doc.hash,
                'filename': os.path.basename(doc.path),
                # Flag to indicate if document has been processed
                'processed': doc.hash is not None
            })

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': f'Error fetching documents: {str(e)}'}), 500
    finally:
        db.close()


@app.route('/document/hash/<hash>', methods=['GET'])
def get_document_by_hash(hash):
    try:
        db = next(get_db())
        document = db.query(Document).filter(Document.hash == hash).first()

        if not document:
            return jsonify({'error': 'Document not found'}), 404

        return send_file(
            document.path,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=os.path.basename(document.path)
        )

    except Exception as e:
        return jsonify({'error': f'Error fetching document: {str(e)}'}), 500
    finally:
        db.close()


@app.route('/structured', methods=['POST'])
def structured_data():
    # Process documents and update their hash values

    # Check if document paths are provided
    if not request.json or 'document_paths' not in request.json:
        return jsonify({'error': 'No document paths provided'}), 400

    document_paths = request.json['document_paths']

    if not document_paths:
        return jsonify({'error': 'Empty document path list'}), 400

    # Create a unique session ID for this batch
    session_id = str(uuid.uuid4())
    session_folder = os.path.join(UPLOAD_FOLDER, session_id)
    os.makedirs(session_folder, exist_ok=True)

    try:
        client = OllamaClient()
        results = []
        db = next(get_db())

        for doc_path in document_paths:
            # Get document from database
            document = db.query(Document).filter(
                Document.path == doc_path).first()

            if not document:
                results.append({
                    'error': f'Document with path {doc_path} not found',
                    'path': doc_path
                })
                continue

            if not os.path.exists(doc_path):
                results.append({
                    'error': f'File not found at path {doc_path}',
                    'path': doc_path
                })
                continue

            # Process document to get structured data
            text = ocr_from_pdf(doc_path)
            structured_result = client.get_structured_data(text)

            # Calculate hash for the structured data
            doc_hash = hash_file(structured_result)

            # Update document in database with hash
            document.hash = doc_hash

            # Add document info to results
            results.append({
                'structured_data': structured_result,
                'hash': doc_hash,
                'path': doc_path,
                'filename': os.path.basename(doc_path),
                'email': document.email
            })

        # Commit all database changes
        db.commit()

        # Clean up temporary session folder
        if os.path.exists(session_folder):
            os.rmdir(session_folder)

        return jsonify(results)

    except Exception as e:
        # Rollback database changes on error
        if 'db' in locals():
            db.rollback()

        # Clean up temporary session folder
        if os.path.exists(session_folder):
            os.rmdir(session_folder)

        return jsonify({'error': f'Error processing documents: {str(e)}'}), 500

    finally:
        if 'db' in locals():
            db.close()


@app.route('/redact', methods=['POST'])
def redact_pdfs():
    # Allow redacting by either document hashes or paths
    if not request.json:
        return jsonify({'error': 'Invalid request format'}), 400

    if 'document_ids' not in request.json and 'document_paths' not in request.json:
        return jsonify({'error': 'Either document_ids or document_paths must be provided'}), 400

    # Get redaction parameters (with defaults)
    method = request.json.get('method', 'full_redact')
    replace_text = request.json.get('replace_text', '[REDACTED]')

    # Validate method
    if method not in ['full_redact', 'obfuscate', 'replace']:
        return jsonify({'error': 'Invalid redaction method'}), 400

    # Create a unique session ID for this batch
    session_id = str(uuid.uuid4())
    session_folder = os.path.join(UPLOAD_FOLDER, session_id)
    os.makedirs(session_folder, exist_ok=True)

    db = next(get_db())
    try:
        # Get documents from database
        processed_files = []

        # Process by hash IDs if provided
        if 'document_ids' in request.json and request.json['document_ids']:
            for doc_id in request.json['document_ids']:
                document = db.query(Document).filter(
                    Document.hash == doc_id).first()
                if not document:
                    return jsonify({'error': f'Document with hash {doc_id} not found'}), 404
                processed_files.append(document.path)

        # Process by paths if provided
        if 'document_paths' in request.json and request.json['document_paths']:
            for doc_path in request.json['document_paths']:
                document = db.query(Document).filter(
                    Document.path == doc_path).first()
                if not document:
                    return jsonify({'error': f'Document with path {doc_path} not found'}), 404
                processed_files.append(document.path)

        if not processed_files:
            return jsonify({'error': 'No valid documents found for processing'}), 400

        # Process the batch of PDFs
        output_paths = process_pdf_redaction(
            processed_files, session_folder, method, replace_text)

        # Create a ZIP file with all redacted PDFs
        memory_file = io.BytesIO()
        with zipfile.ZipFile(memory_file, 'w') as zf:
            for output_path in output_paths:
                arcname = os.path.basename(output_path)
                zf.write(output_path, arcname)

        memory_file.seek(0)

        # Clean up temporary files
        for output_path in output_paths:
            if os.path.exists(output_path):
                os.remove(output_path)

        if os.path.exists(session_folder):
            os.rmdir(session_folder)

        return send_file(
            memory_file,
            mimetype='application/zip',
            as_attachment=True,
            download_name=f'redacted_pdfs_{session_id}.zip'
        )

    except Exception as e:
        # Clean up on error
        if os.path.exists(session_folder):
            os.rmdir(session_folder)
        return jsonify({'error': f'Error processing PDFs: {str(e)}'}), 500
    finally:
        db.close()


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
