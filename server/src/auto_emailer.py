import yagmail

def send_email(to_email, subject, html_content):
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
        yag.send(to=to_email, subject=subject, contents=html_content)
        return {"status": "success", "message": "Email sent successfully"}
    except Exception as e:
        return {"status": "error", "message": f"Error sending email: {str(e)}"}