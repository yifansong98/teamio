import string
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import firebase_admin
from firebase_admin import credentials, auth, db
from dotenv import load_dotenv
import os

load_dotenv()

# -------------- SETUP FIREBASE ADMIN SDK --------------
# IMPORTANT: Update these paths and URLs for your project
try:
    cred = credentials.Certificate("../TEAMIO_FIREBASE_SERVICE_CREDENTIALS.json")
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
# WARNING: Storing credentials in code is not recommended for production.
# Consider using environment variables or a secrets manager.
SENDER_EMAIL = os.getenv("SENDER_EMAIL")  # Your Gmail address
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD")  # Your Gmail App Password
SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = os.getenv("SMTP_PORT")

def send_email(recipient, name, password):
    """Sends an email with the new user credentials."""
    subject = "Your TeamIO Account Credentials"
    body = f"""
Hi {name},

Your account has been created successfully!

You can log in using the following credentials:

Email: {recipient}
Password: {password}

Best,
The TeamIO Team
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


# -------------- LOAD USERS FROM FIREBASE RTDB --------------
def load_users_from_rtdb():
    """Fetches user data from the /users node in Realtime Database."""
    try:
        ref = db.reference('users')
        all_users_data = ref.get()

        if not all_users_data:
            print("No users found in the Realtime Database.")
            return []

        # Transform the dictionary from Firebase into the list format needed
        users_list = [
            {'user_id': user_id, 'email': user_info.get('email'), 'full_name': user_info.get('full_name')}
            for user_id, user_info in all_users_data.items()
            if user_info.get('email') # Ensure email exists
        ]
        print(f"Found {len(users_list)} users in the database.")
        return users_list
    except Exception as e:
        print(f"❌ Failed to fetch users from Firebase RTDB: {e}")
        return []

# -------------- FIREBASE AUTH USER CREATION --------------
def create_auth_users(users):
    """Creates users in Firebase Authentication."""
    if not users:
        print("No users to process.")
        return

    for user in users:
        email = user["email"].strip()
        user_id = user["user_id"].strip()
        full_name = user.get("full_name", "").strip()
        
        # 1. Check if user already exists in Firebase Auth
        try:
            auth.get_user_by_email(email)
            print(f"⏩ User {email} already exists in Auth. Skipping.")
            continue
        except auth.UserNotFoundError:
            # User does not exist, proceed with creation
            pass
        except Exception as e:
            print(f"❌ An unexpected error occurred while checking {email}: {e}")
            continue

        # 2. If user doesn't exist, create them
        password = generate_token()
        try:
            auth.create_user(
                email=email,
                password=password,
                display_name=full_name  # Using user_id as the display name
            )
            print(f"✅ Created authentication user for {email}")
            send_email(email, full_name, password)
        except Exception as e:
            print(f"❌ Failed to create authentication user for {email}: {e}")


# -------------- MAIN EXECUTION --------------
if __name__ == "__main__":
    users_to_create = load_users_from_rtdb()
    create_auth_users(users_to_create)