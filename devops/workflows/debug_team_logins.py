import firebase_admin
from firebase_admin import credentials, db

def debug_team_logins(team_id):
    """
    Debug what logins are currently stored for a team.
    """
    try:
        # Initialize Firebase Admin SDK
        cred = credentials.Certificate("../../teamio-backend/FIREBASE_SERVICE_CREDENTIALS.json")
        firebase_admin.initialize_app(cred, {
            'databaseURL': 'https://teamio-test-default-rtdb.firebaseio.com'
        })
        print("Firebase app initialized successfully.")

        # Get team logins
        logins_ref = db.reference(f'teams/{team_id}/logins')
        logins_data = logins_ref.get() or {}
        
        print(f"\n=== Current logins for team '{team_id}' ===")
        print(f"Total logins: {len(logins_data)}")
        
        google_docs_logins = []
        other_logins = []
        
        for key, login_data in logins_data.items():
            if isinstance(login_data, dict):
                tool = login_data.get('tool', 'unknown')
                login = login_data.get('login', 'unknown')
                user_id = login_data.get('user_id', 'unknown')
                
                if tool == 'google_docs':
                    google_docs_logins.append({
                        'key': key,
                        'login': login,
                        'user_id': user_id,
                        'tool': tool
                    })
                else:
                    other_logins.append({
                        'key': key,
                        'login': login,
                        'user_id': user_id,
                        'tool': tool
                    })
        
        print(f"\nGoogle Docs logins ({len(google_docs_logins)}):")
        for login in google_docs_logins:
            print(f"  - {login['login']} (user_id: {login['user_id']})")
        
        print(f"\nOther tool logins ({len(other_logins)}):")
        for login in other_logins:
            print(f"  - {login['login']} (tool: {login['tool']})")
        
        # Check if there are any logins without tool markers (old format)
        old_format_logins = []
        for key, login_data in logins_data.items():
            if isinstance(login_data, dict) and 'tool' not in login_data:
                old_format_logins.append({
                    'key': key,
                    'login': login_data.get('login', 'unknown'),
                    'user_id': login_data.get('user_id', 'unknown')
                })
        
        if old_format_logins:
            print(f"\n⚠️  Old format logins without tool markers ({len(old_format_logins)}):")
            for login in old_format_logins:
                print(f"  - {login['login']} (user_id: {login['user_id']})")
        
        return {
            'google_docs_logins': google_docs_logins,
            'other_logins': other_logins,
            'old_format_logins': old_format_logins
        }

    except Exception as e:
        print(f"❌ Error debugging team logins: {e}")
        return None

if __name__ == "__main__":
    import sys
    team_id = sys.argv[1] if len(sys.argv) > 1 else "vitals"
    debug_team_logins(team_id)
