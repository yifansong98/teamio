import argparse
import firebase_admin
from firebase_admin import credentials, db

def add_team():
    parser = argparse.ArgumentParser(description="Add a team with its students")

    # Define command-line arguments
    parser.add_argument("--team-id", required=True, help="The ID of the team")
    parser.add_argument(
        "--students",
        nargs="+",  # allows multiple student names
        required=True,
        help="List of student names in the team"
    )

    # Parse the arguments
    args = parser.parse_args()

    # Example: print or process the input
    # team_id = args.team_id
    # students = args.students

    try:
        cred = credentials.Certificate("../TEAMIO_FIREBASE_SERVICE_CREDENTIALS.json")  # Path to your Firebase service account JSON
        firebase_admin.initialize_app(cred, {
            'databaseURL': 'https://teamio-test-default-rtdb.firebaseio.com'  # Replace with your Firebase database URL
        })

        ref = db.reference(f'teams/{args.team_id}')
        ref.set({
            'students': args.students
        })
        print(f"Team {args.team_id} with students {args.students} added successfully.")

    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        return



if __name__ == "__main__":
    add_team()