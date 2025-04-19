# model.py
from presidio_analyzer import AnalyzerEngine, Pattern, PatternRecognizer

def analyze_text_from_string(text, file_name="Uploaded text"):
    """Analyze text content for PII using Presidio"""
    
    # Aadhaar number pattern: 1234-5678-9012 or 123456789012
    aadhaar_pattern = Pattern(
        name="aadhaar_pattern", 
        regex=r"\b\d{4}[- ]?\d{4}[- ]?\d{4}\b", 
        score=0.85
    )
    
    # Create a recognizer for Aadhaar
    aadhaar_recognizer = PatternRecognizer(
        supported_entity="AADHAAR_IN", 
        patterns=[aadhaar_pattern]
    )
    
    # Initialize analyzer engine
    analyzer = AnalyzerEngine()
    analyzer.registry.add_recognizer(aadhaar_recognizer)
    
    # Analyze
    results = analyzer.analyze(text=text, language='en')
    
    # Initialize grouped entity dictionary
    grouped_entities = {}
    
    # Group the results
    for r in results:
        if r.score > 0.7:  # Include only entities with a score > 0.7
            entity_type = r.entity_type
            entity_text = text[r.start:r.end]
            
            if entity_type not in grouped_entities:
                grouped_entities[entity_type] = []
            
            grouped_entities[entity_type].append(entity_text)
    
    # Convert grouped entities to a clean list of text
    output_list = []
    if grouped_entities:
        for entities in grouped_entities.values():
            output_list.extend(set(entities))  # Flatten and remove duplicates
    
    print(f"Identified PII in {file_name}: {output_list}")
    return output_list


# The following function is kept for compatibility with original code
def analyze_single_file(file_path="extracted.txt"):
    """Handle file analysis for a single file on a local machine"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            text_content = file.read()
        output_list = analyze_text_from_string(text_content, file_path)
        return output_list  # Return the list for further use
    except Exception as e:
        print(f"Error analyzing file: {e}")
        return []