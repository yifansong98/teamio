import firebase_admin
from firebase_admin import credentials, db

def clean_database():
    try:
        # Initialize Firebase Admin SDK
        cred = credentials.Certificate("TEAMIO_FIREBASE_SERVICE_CREDENTIALS.json")  # Path to your Firebase service account JSON
        firebase_admin.initialize_app(cred, {
            'databaseURL': 'https://teamio-test-default-rtdb.firebaseio.com'  # Replace with your Firebase database URL
        })

        # Get a reference to the root of the database
        root_ref = db.reference('/')

        # Delete everything in the database
        root_ref.delete()

        print("Database cleaned successfully. All data has been deleted.")
    except Exception as e:
        print(f"An error occurred while cleaning the database: {e}")

if __name__ == "__main__":
    clean_database()