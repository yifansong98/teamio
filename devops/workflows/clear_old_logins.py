import firebase_admin
from firebase_admin import credentials, db

def clear_old_logins(team_id):
    """
    Clear old format logins that don't have tool markers.
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
        
        print(f"\n=== Clearing old format logins for team '{team_id}' ===")
        print(f"Total logins before: {len(logins_data)}")
        
        # Identify old format logins to clear
        logins_to_clear = []
        other_logins = {}
        
        for key, login_data in logins_data.items():
            if isinstance(login_data, dict):
                tool = login_data.get('tool')
                # Keep logins that have proper tool markers
                if tool in ['google_docs', 'github']:
                    other_logins[key] = login_data
                # Clear old format logins (no tool marker or login == 'unknown')
                elif tool is None or login_data.get('login') == 'unknown':
                    logins_to_clear.append(key)
                    print(f"  Will clear: {key} -> {login_data}")
                else:
                    other_logins[key] = login_data
            else:
                other_logins[key] = login_data
        
        # Clear the old logins
        if logins_to_clear:
            for key in logins_to_clear:
                logins_ref.child(key).delete()
            print(f"\n✅ Cleared {len(logins_to_clear)} old format logins")
        else:
            print("\n✅ No old format logins found to clear")
        
        # Verify the result
        updated_logins = logins_ref.get() or {}
        print(f"Total logins after: {len(updated_logins)}")
        
        print(f"\nRemaining logins:")
        for key, login_data in updated_logins.items():
            if isinstance(login_data, dict):
                tool = login_data.get('tool', 'unknown')
                login = login_data.get('login', 'unknown')
                print(f"  - {key}: {login} (tool: {tool})")
        
        return True

    except Exception as e:
        print(f"❌ Error clearing old logins: {e}")
        return False

if __name__ == "__main__":
    import sys
    team_id = sys.argv[1] if len(sys.argv) > 1 else "vitals"
    clear_old_logins(team_id)
