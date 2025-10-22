import firebase_admin
from firebase_admin import credentials, db

def check_contribution_details():
    """
    Check the details of the contribution that was posted.
    """
    try:
        # Initialize Firebase Admin SDK
        cred = credentials.Certificate("../../teamio-backend/FIREBASE_SERVICE_CREDENTIALS.json")
        firebase_admin.initialize_app(cred, {
            'databaseURL': 'https://teamio-test-default-rtdb.firebaseio.com'
        })
        print("Firebase app initialized successfully.")

        # Get contributions
        contributions_ref = db.reference('contributions')
        contributions_data = contributions_ref.get() or {}
        
        print(f"\n=== Contribution Details ===")
        print(f"Total contributions: {len(contributions_data)}")
        
        for contrib_id, contrib_data in contributions_data.items():
            print(f"\nContribution ID: {contrib_id}")
            print(f"Data: {contrib_data}")
            
            # Check if it's nested under team_id
            if isinstance(contrib_data, dict) and 'team_id' in contrib_data:
                print(f"Team ID in data: {contrib_data['team_id']}")
            else:
                print("No team_id found in contribution data")
        
        return True

    except Exception as e:
        print(f"❌ Error checking contribution details: {e}")
        return False

if __name__ == "__main__":
    check_contribution_details()
