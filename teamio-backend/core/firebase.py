import firebase_admin
from firebase_admin import credentials, db
import os

def initialize_firebase():
    try:
        cred = credentials.Certificate("FIREBASE_SERVICE_CREDENTIALS.json")
        firebase_admin.initialize_app(cred, {
            'databaseURL': os.getenv('FIREBASE_DATABASE_URL', 'https://teamio-test-default-rtdb.firebaseio.com')
        })
        print("Firebase initialized successfully")
    except Exception as e:
        print(f"Firebase initialization failed: {e}")
        raise

# Export the Firebase database reference
db_ref = db.reference