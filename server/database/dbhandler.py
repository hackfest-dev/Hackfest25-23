from database.models import Document, SessionLocal, Base, engine
import hashlib
import json

Base.metadata.create_all(bind=engine)


def hash_file(file_dict):
    hasher = hashlib.sha256()
    dict_str = json.dumps(file_dict, sort_keys=True)
    return hashlib.sha256(dict_str.encode('utf-8')).hexdigest()


def save_document(file_path, email):
    file_hash = hash_file(file_path)

    db = SessionLocal()
    doc = Document(hash=file_hash, path=file_path, email=email)

    try:
        db.add(doc)
        db.commit()
        print(f"Inserted: {file_hash} -> {file_path}")
    except Exception as e:
        db.rollback()
        print(f"Failed to insert: {e}")
    finally:
        db.close()
