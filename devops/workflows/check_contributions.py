import firebase_admin
from firebase_admin import credentials, db

def check_contributions(team_id):
    """
    Check what contributions exist for a team.
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
        
        print(f"\n=== Contributions for team '{team_id}' ===")
        print(f"Total contributions in database: {len(contributions_data)}")
        
        team_contributions = []
        for contrib_id, contrib_data in contributions_data.items():
            if isinstance(contrib_data, dict) and contrib_data.get('team_id') == team_id:
                team_contributions.append({
                    'id': contrib_id,
                    'tool': contrib_data.get('tool', 'unknown'),
                    'metric': contrib_data.get('metric', 'unknown'),
                    'title': contrib_data.get('title', 'unknown'),
                    'login': contrib_data.get('login', 'unknown')
                })
        
        print(f"Team {team_id} contributions: {len(team_contributions)}")
        for contrib in team_contributions:
            print(f"  - {contrib['id']}: {contrib['tool']}/{contrib['metric']} - {contrib['title']} (by {contrib['login']})")
        
        return team_contributions

    except Exception as e:
        print(f"❌ Error checking contributions: {e}")
        return []

if __name__ == "__main__":
    import sys
    team_id = sys.argv[1] if len(sys.argv) > 1 else "vitals"
    check_contributions(team_id)
