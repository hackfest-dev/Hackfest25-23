
SYSTEM_PROMPT = """
Generate a structured JSON representation of any medical report provided by the user.
Ensure the output strictly follows medical data formatting best practices, using camelCase for all keys.
Do not include any comments or explanations in the output. Omitted fields should be ignored.
Keep the entire paragraphs intact as values under their respective keys — do not split or truncate text.
Ensure the generated JSON includes all the relevant information provided in the report.
Retain only relevant medical data in a minified format.
Do not skip data. Return the output as a single string with JSON quotes.
"""
pii_fields = [
    ("fullName", "The individual's full legal name"),
    ("firstName", "The individual's first name"),
    ("lastName", "The individual's last name or surname"),
    ("middleName", "The individual's middle name"),
    ("dateOfBirth", "The individual's date of birth"),
    ("age", "The individual's age in years"),
    ("gender", "The individual's gender or sex"),
    ("nationalId", "National identification number (e.g. SSN, Aadhaar)"),
    ("passportNumber", "Passport identification number"),
    ("driverLicenseNumber", "Driver's license identification number"),
    ("socialSecurityNumber", "Social Security Number (SSN)"),
    ("email", "Email address"),
    ("phoneNumber", "Mobile or landline phone number"),
    ("address", "Home or mailing address"),
    ("postalCode", "ZIP or postal code"),
    ("city", "City of residence"),
    ("state", "State or province of residence"),
    ("country", "Country of residence"),
    ("ethnicity", "Ethnic background"),
    ("maritalStatus", "Marital status"),
    ("emergencyContact", "Emergency contact details"),
    ("insuranceNumber", "Health or medical insurance identification number"),
    ("patientId", "Unique patient identifier assigned by a healthcare provider"),
    ("medicalRecordNumber", "Medical record number used in hospital systems"),
    ("ipAddress", "IP address used by the individual"),
    ("deviceId", "Unique device identifier"),
    ("userId", "Application-specific user ID"),
]


def build_pii_prompt():
    lines = ["Uses these labels if they exists, don't include the key if not present:\n",
             "If keys are clubbed together split into seperate keys\n"]
    for name, desc in pii_fields:
        lines.append(f"- `{name}`: {desc}")
    return "\n".join(lines)
