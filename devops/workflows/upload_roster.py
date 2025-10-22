import argparse
import csv
import firebase_admin
from firebase_admin import credentials, db

def upload_roster():
    """
    Reads a CSV file with team and user data and uploads it to Firebase Realtime Database.
    The CSV must contain 'team_id', 'user_id', 'email', and 'full_name' columns.
    """
    parser = argparse.ArgumentParser(description="Upload a roster from a CSV to Firebase RTDB.")
    parser.add_argument(
        "--file",
        required=True,
        help="Path to the CSV file containing the roster."
    )
    args = parser.parse_args()

    # --- Firebase Initialization ---
    try:
        # IMPORTANT: Replace with the actual path to your service account key file
        cred = credentials.Certificate("../../teamio-backend/FIREBASE_SERVICE_CREDENTIALS.json")
        firebase_admin.initialize_app(cred, {
            # IMPORTANT: Replace with your Firebase database URL
            'databaseURL': 'https://teamio-test-default-rtdb.firebaseio.com'
        })
        print("Firebase app initialized successfully.")
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        return

    # --- Data Processing ---
    data_to_upload = {}
    try:
        with open(args.file, mode='r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                team_id = row.get('team_id')
                user_id = row.get('user_id')
                email = row.get('email')
                full_name = row.get('full_name')

                if not all([team_id, user_id, email]):
                    print(f"Warning: Skipping invalid row: {row}")
                    continue

                # Path for the team structure: /teams/{team_id}/members/{user_id}
                team_path = f'teams/{team_id}/members/{user_id}'
                data_to_upload[team_path] = True

                # Path for the user structure: /users/{user_id}
                user_path = f'users/{user_id}'
                data_to_upload[user_path] = {
                    'email': email,
                    'team_id': team_id,
                    'full_name': full_name
                }

    except FileNotFoundError:
        print(f"Error: The file '{args.file}' was not found.")
        return
    except Exception as e:
        print(f"An error occurred while reading the CSV file: {e}")
        return

    # --- Database Upload ---
    if not data_to_upload:
        print("No valid data found to upload.")
        return

    try:
        # Perform a multi-location update in a single atomic operation
        db.reference().update(data_to_upload)
        print(f"Successfully uploaded data for {len(data_to_upload) // 2} users.")
    except Exception as e:
        print(f"An error occurred during the database upload: {e}")


if __name__ == "__main__":
    upload_roster()