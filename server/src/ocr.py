import fitz 
import pytesseract
from PIL import Image
import io


def ocr_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    all_text = ""

    for i, page in enumerate(doc):
        pix = page.get_pixmap(dpi=300)

        img = Image.open(io.BytesIO(pix.tobytes("png")))

        text = pytesseract.image_to_string(img)
        all_text += f"\n--- Page {i + 1} ---\n{text}"

    return all_text


