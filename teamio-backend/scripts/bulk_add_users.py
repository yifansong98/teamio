import csv
import string
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import firebase_admin
from firebase_admin import credentials, auth

# -------------- SETUP FIREBASE ADMIN SDK --------------
cred = credentials.Certificate("../TEAMIO_FIREBASE_SERVICE_CREDENTIALS.json")
firebase_admin.initialize_app(cred)

# -------------- TOKEN GENERATION --------------
def generate_token(length=12):
    chars = string.ascii_letters + string.digits
    return ''.join(secrets.choice(chars) for _ in range(length))

# -------------- EMAIL CONFIG --------------
SENDER_EMAIL = "rohankumarrr313@gmail.com"
SENDER_PASSWORD = "fmgu frqw yswm opva"  # Use a Gmail app password, not your real one
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

def send_email(recipient, name, password):
    subject = "Your TeamIO Account Credentials"
    body = f"""
Hi {name},

Your account has been created successfully!

You can log in using the following credentials:

Email: {recipient}
Password: {password}

Best,
The Team
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

# -------------- FIREBASE USER CREATION --------------
def create_users(users):
    for user in users:
        email = user["email"].strip()
        name = user.get("name", "").strip()
        password = generate_token()

        try:
            auth.create_user(
                email=email,
                password=password,
                display_name=name
            )
            print(f"✅ Created user: {email}")
            send_email(email, name or "there", password)
        except Exception as e:
            print(f"❌ Failed to create {email}: {e}")

# -------------- LOAD USERS FROM CSV --------------
def load_users_from_csv(file_path):
    with open(file_path, newline="") as csvfile:
        reader = csv.DictReader(csvfile)
        return [row for row in reader]

# -------------- MAIN EXECUTION --------------
if __name__ == "__main__":
    users = load_users_from_csv("../authenticated-users.csv")
    create_users(users)