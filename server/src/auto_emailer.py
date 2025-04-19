import yagmail

def send_email(to_email):
    """
    Sends an email using Yagmail.

    Parameters:
        to_email: Recipient's email address.
        subject: Subject of the email.
        html_content: HTML content of the email.
    """
    try:
        # Initializing the server connection
        yag = yagmail.SMTP(user='redactly.ai@gmail.com', password='dmzhqlwrqeuuianr')
        # Sending the email
        yag.send(to=to_email, subject="Verify Access to Medical Records", contents="Kindly review and verify the redacted document before it is shared for research")
        return {"status": "success", "message": "Email sent successfully"}
    except Exception as e:
        return {"status": "error", "message": f"Error sending email: {str(e)}"}