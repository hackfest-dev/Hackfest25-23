from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import uuid
import io
import zipfile
from src.redaction_service import process_pdf_redaction
from src.ocr_redaction import ocr_from_pdf
from src.ollamahandler import OllamaClient

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'temp_uploads'
ALLOWED_EXTENSIONS = {'pdf'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/structured', methods=['POST'])
def structured_data():
    # Check if the post request has files
    if 'files' not in request.files:
        return jsonify({'error': 'No files provided'}), 400

    files = request.files.getlist('files')

    # Check if at least one file was submitted
    if len(files) == 0 or files[0].filename == '':
        return jsonify({'error': 'No files selected'}), 400

    # Create a unique session ID for this batch
    session_id = str(uuid.uuid4())
    session_folder = os.path.join(UPLOAD_FOLDER, session_id)
    os.makedirs(session_folder, exist_ok=True)

    processed_files = []
    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(session_folder, filename)
            file.save(file_path)
            processed_files.append(file_path)

    if not processed_files:
        return jsonify({'error': 'No valid PDF files were uploaded'}), 400

    try:
        client = OllamaClient()
        results = []

        for pdf_path in processed_files:
            text = ocr_from_pdf(pdf_path)
            response = client.get_structured_data(text)
            results.append(response)

        # Clean up temporary files
        for file_path in processed_files:
            if os.path.exists(file_path):
                os.remove(file_path)
        os.rmdir(session_folder)

        return jsonify(results)

    except Exception as e:
        # Clean up on error
        for file_path in processed_files:
            if os.path.exists(file_path):
                os.remove(file_path)
        if os.path.exists(session_folder):
            os.rmdir(session_folder)
        return jsonify({'error': f'Error processing PDFs: {str(e)}'}), 500


@app.route('/redact', methods=['POST'])
def redact_pdfs():
    # Check if the post request has files
    if 'files' not in request.files:
        return jsonify({'error': 'No files provided'}), 400

    files = request.files.getlist('files')

    # Check if at least one file was submitted
    if len(files) == 0 or files[0].filename == '':
        return jsonify({'error': 'No files selected'}), 400

    # Get redaction parameters (with defaults)
    # default to full_redact
    method = request.form.get('method', 'full_redact')
    replace_text = request.form.get('replace_text', '[REDACTED]')

    # Validate method
    if method not in ['full_redact', 'obfuscate', 'replace']:
        return jsonify({'error': 'Invalid redaction method'}), 400

    # Create a unique session ID for this batch
    session_id = str(uuid.uuid4())
    session_folder = os.path.join(UPLOAD_FOLDER, session_id)
    os.makedirs(session_folder, exist_ok=True)

    # Process and store files
    processed_files = []

    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(session_folder, filename)
            file.save(file_path)
            processed_files.append(file_path)

    if not processed_files:
        return jsonify({'error': 'No valid PDF files were uploaded'}), 400

    try:
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
        for file_path in processed_files + output_paths:
            if os.path.exists(file_path):
                os.remove(file_path)
        os.rmdir(session_folder)

        return send_file(
            memory_file,
            mimetype='application/zip',
            as_attachment=True,
            download_name=f'redacted_pdfs_{session_id}.zip'
        )

    except Exception as e:
        # Clean up on error
        for file_path in processed_files:
            if os.path.exists(file_path):
                os.remove(file_path)
        if os.path.exists(session_folder):
            os.rmdir(session_folder)
        return jsonify({'error': f'Error processing PDFs: {str(e)}'}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
