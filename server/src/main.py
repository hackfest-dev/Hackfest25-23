

from src.ocr import ocr_from_pdf
from src.ollamahandler import OllamaClient


def process_file():

    pdf_path = "assets/test2.pdf"
    client = OllamaClient()
    text = ocr_from_pdf(pdf_path)
    response = client.get_structured_data(text)
    return response
