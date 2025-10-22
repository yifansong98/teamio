import firebase_admin
from firebase_admin import credentials, db

def check_all_contributions():
    """
    Check all contributions in the database to see what teams they belong to.
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
        
        print(f"\n=== All Contributions in Database ===")
        print(f"Total contributions: {len(contributions_data)}")
        
        team_counts = {}
        for contrib_id, contrib_data in contributions_data.items():
            if isinstance(contrib_data, dict):
                team_id = contrib_data.get('team_id', 'unknown')
                tool = contrib_data.get('tool', 'unknown')
                metric = contrib_data.get('metric', 'unknown')
                login = contrib_data.get('login', 'unknown')
                
                if team_id not in team_counts:
                    team_counts[team_id] = []
                
                team_counts[team_id].append({
                    'id': contrib_id,
                    'tool': tool,
                    'metric': metric,
                    'login': login
                })
        
        for team_id, contributions in team_counts.items():
            print(f"\nTeam '{team_id}': {len(contributions)} contributions")
            for contrib in contributions:
                print(f"  - {contrib['id']}: {contrib['tool']}/{contrib['metric']} (by {contrib['login']})")
        
        return team_counts

    except Exception as e:
        print(f"❌ Error checking contributions: {e}")
        return {}

if __name__ == "__main__":
    check_all_contributions()
