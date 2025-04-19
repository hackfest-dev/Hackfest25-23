# ocr_redaction.py
import fitz
import pytesseract
import cv2
import io
import numpy as np
from PIL import Image

def print_contents(input_path, output_txt_path):
    """
    Extract all text content from a PDF and write it to a text file.
    
    Parameters:
        input_path: Path to the input PDF file
        output_txt_path: Path where the extracted text will be saved
    """
    doc = fitz.open(input_path)
    all_text = []
    
    # Extract text from document text layer
    for page_num, page in enumerate(doc):
        # Use "text" mode for better text extraction
        text = page.get_text("text")
        if text.strip():  # Only add non-empty text
            all_text.append(f"--- Page {page_num + 1} ---\n{text}\n")
        
        # Also extract text from images using OCR
        for img in page.get_images(full=True):
            xref = img[0]
            base_image = doc.extract_image(xref)
            img_bytes = base_image["image"]
            
            # Convert image bytes to format suitable for OCR
            image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
            open_cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            
            # Perform OCR on the image
            ocr_text = perform_ocr(open_cv_image)
            if ocr_text.strip():  # Only add non-empty OCR text
                all_text.append(f"--- Image OCR on Page {page_num + 1} ---\n{ocr_text}\n")
    
    # Write all extracted text to the output file
    with open(output_txt_path, 'w', encoding='utf-8') as f:
        f.write("".join(all_text))
    
    print(f"Extracted text saved to {output_txt_path}")
    doc.close()


def perform_ocr(image):
    """
    Perform OCR on an image and return the extracted text.
    
    Parameters:
        image: The image to process (OpenCV format).
    
    Returns:
        Extracted text as a string.
    """
    custom_config = r'--oem 3 --psm 6 -c preserve_interword_spaces=1'
    ocr_text = pytesseract.image_to_string(image, config=custom_config)
    return ocr_text


def legal_redact_pdf(input_path, output_path, pii_terms=None, 
                     method="full_redact", replace_text="[REDACTED]"):
    """
    Redact sensitive information from a PDF.
    
    Parameters:
        input_path: Path to the input PDF file
        output_path: Path where the redacted PDF will be saved
        pii_terms: List of terms to redact (sensitive information)
        method: "full_redact" (remove text), "obfuscate" (black box), 
                "replace" (text substitution)
        replace_text: Text to insert if method="replace"
    """
    if pii_terms is None:
        pii_terms = []
        
    doc = fitz.open(input_path)
    
    for page in doc:
        # --- TEXT LAYER PROCESSING ---
        for term in pii_terms:
            areas = page.search_for(term, quads=True)
            
            for quad in areas:
                if method == "replace":
                    # Add white box first
                    page.add_redact_annot(quad, fill=(1, 1, 1), text=replace_text)
                elif method == "obfuscate":
                    page.add_redact_annot(quad, fill=(0, 0, 0))
                else:  # full legal redaction
                    page.add_redact_annot(quad, text="")  # Complete removal

        # --- IMAGE LAYER PROCESSING ---
        for img in page.get_images(full=True):
            xref = img[0]
            base_image = doc.extract_image(xref)
            img_bytes = base_image["image"]
            
            # OCR and redact image
            redacted_img = process_image_with_ocr(
                img_bytes, 
                pii_terms, 
                method=method,
                replace_text=replace_text
            )
            
            # Replace original image
            page.insert_image(
                page.rect,
                stream=redacted_img,
                overlay=True
            )

        # Apply all redactions for this page
        page.apply_redactions()
        
    # Remove metadata and sensitive tags
    doc.set_metadata({})
    doc.del_xml_metadata()
    doc.save(output_path, 
             deflate=True, 
             garbage=3,  # Remove deleted objects
             clean=True,  # Sanitize content
             encryption=fitz.PDF_ENCRYPT_KEEP)
    doc.close()


def process_image_with_ocr(img_bytes, pii_terms, method, replace_text):
    """Process image with OCR and redaction"""
    image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    open_cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    
    # Enhanced OCR processing
    custom_config = r'--oem 3 --psm 6 -c preserve_interword_spaces=1'
    ocr_result = pytesseract.image_to_data(
        open_cv_image, 
        config=custom_config,
        output_type=pytesseract.Output.DICT
    )
    
    for i in range(len(ocr_result['text'])):
        text = ocr_result['text'][i]
        if any(term.lower() in text.lower() for term in pii_terms):
            x, y, w, h = (
                ocr_result['left'][i],
                ocr_result['top'][i],
                ocr_result['width'][i],
                ocr_result['height'][i]
            )
            
            if method == "replace":
                # White background + new text
                cv2.rectangle(open_cv_image, (x, y), (x+w, y+h), (255, 255, 255), -1)
                cv2.putText(
                    open_cv_image,
                    replace_text,
                    (x, y+h//2),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (0, 0, 0),
                    1
                )
            elif method == "obfuscate":
                cv2.rectangle(open_cv_image, (x, y), (x+w, y+h), (0, 0, 0), -1)
            else:  # full redaction
                cv2.rectangle(open_cv_image, (x, y), (x+w, y+h), (255, 255, 255), -1)

    # Convert back to bytes
    _, img_encoded = cv2.imencode('.png', open_cv_image)
    return img_encoded.tobytes()