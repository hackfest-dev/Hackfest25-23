from flask import Flask, jsonify

from src.main import process_file
app = Flask(__name__)


@app.route("/api")
def hello():
    response = process_file()
    return jsonify(response)
