# redaction_service.py
import os
from src.ocr_redaction import print_contents, legal_redact_pdf
from src.model import analyze_text_from_string


def process_pdf_redaction(input_files, output_folder, method='full_redact', replace_text='[REDACTED]'):
    """
    Process a batch of PDF files for redaction

    Parameters:
        input_files: List of paths to input PDF files
        output_folder: Folder to store output files
        method: Redaction method ('full_redact', 'obfuscate', 'replace')
        replace_text: Text to use for replacement if method is 'replace'

    Returns:
        List of paths to redacted PDF files
    """
    output_paths = []

    for input_path in input_files:
        # Get the base filename
        base_filename = os.path.basename(input_path)
        file_id = os.path.splitext(base_filename)[0]

        # Define paths for intermediate and output files
        extracted_text_path = os.path.join(
            output_folder, f"{file_id}_extracted.txt")
        output_path = os.path.join(output_folder, f"{file_id}_redacted.pdf")

        # Step 1: Extract text from PDF
        print_contents(input_path, extracted_text_path)

        # Step 2: Analyze extracted text to identify PII
        try:
            with open(extracted_text_path, 'r', encoding='utf-8') as file:
                text_content = file.read()
            pii_terms = analyze_text_from_string(text_content)
        except Exception as e:
            raise Exception(f"Error analyzing text: {str(e)}")

        # Step 3: Perform redaction
        legal_redact_pdf(
            input_path,
            output_path,
            pii_terms=pii_terms,
            method=method,
            replace_text=replace_text
        )

        # Add to list of processed files
        output_paths.append(output_path)

        # Clean up the extracted text file
        if os.path.exists(extracted_text_path):
            os.remove(extracted_text_path)

    return output_paths
