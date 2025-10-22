import string
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import firebase_admin
from firebase_admin import credentials, auth
from dotenv import load_dotenv
import os

load_dotenv()

# -------------- SETUP FIREBASE ADMIN SDK --------------
try:
    cred = credentials.Certificate("../../teamio-backend/FIREBASE_SERVICE_CREDENTIALS.json")
    firebase_admin.initialize_app(cred, {
        'databaseURL': 'https://teamio-test-default-rtdb.firebaseio.com'
    })
    print("Firebase app initialized successfully.")
except Exception as e:
    print(f"❌ Error initializing Firebase: {e}")
    exit()

# -------------- TOKEN GENERATION --------------
def generate_token(length=12):
    """Generates a secure random password."""
    chars = string.ascii_letters + string.digits
    return ''.join(secrets.choice(chars) for _ in range(length))

# -------------- EMAIL CONFIG --------------
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD")
SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = os.getenv("SMTP_PORT")

def send_email(recipient, name, password):
    """Sends an email with the new user credentials."""
    subject = "Your Vitals Account Credentials - Password Reset"
    body = f"""
Hi {name},

Your password has been reset successfully!

You can log in using the following credentials:

Email: {recipient}
Password: {password}

Best,
The Vitals Team
"""

    msg = MIMEMultipart()
    msg["From"] = SENDER_EMAIL
    msg["To"] = recipient
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(msg)
        print(f"📧 Email sent to {recipient}")
    except Exception as e:
        print(f"❌ Failed to send email to {recipient}: {e}")

# -------------- RESET USER PASSWORD --------------
def reset_user_password(email):
    """Resets password for a specific user."""
    try:
        # Get user by email
        user = auth.get_user_by_email(email)
        print(f"Found user: {user.display_name} ({user.email})")
        
        # Generate new password
        new_password = generate_token()
        
        # Update user password
        auth.update_user(user.uid, password=new_password)
        print(f"✅ Password updated for {email}")
        print(f"🔑 New password: {new_password}")
        
        # Send email with new password
        send_email(email, user.display_name or "User", new_password)
        
        return new_password
        
    except auth.UserNotFoundError:
        print(f"❌ User {email} not found in Firebase Auth")
        return None
    except Exception as e:
        print(f"❌ Failed to reset password for {email}: {e}")
        return None

# -------------- MAIN EXECUTION --------------
if __name__ == "__main__":
    email = "lgarg2@illinois.edu"
    password = reset_user_password(email)
    
    if password:
        print(f"\n🎉 Success! New password for {email}: {password}")
    else:
        print(f"\n❌ Failed to reset password for {email}")
