import firebase_admin
from firebase_admin import credentials, db

def check_mapping_data():
    """
    Check the actual mapping data stored in the database.
    """
    try:
        # Initialize Firebase Admin SDK
        cred = credentials.Certificate("../../teamio-backend/FIREBASE_SERVICE_CREDENTIALS.json")
        firebase_admin.initialize_app(cred, {
            'databaseURL': 'https://teamio-test-default-rtdb.firebaseio.com'
        })
        print("Firebase app initialized successfully.")

        print(f"\n=== Mapping Data for team 'vitals' ===")
        logins_ref = db.reference('teams/vitals/logins')
        logins_data = logins_ref.get() or {}
        
        print(f"Total logins: {len(logins_data)}")
        
        mapped_logins = {}
        unmapped_logins = []
        
        for key, login_info in logins_data.items():
            if isinstance(login_info, dict):
                login = login_info.get('login', key)
                user_id = login_info.get('user_id', '')
                tool = login_info.get('tool', '')
                
                if user_id and user_id != login:
                    mapped_logins[login] = user_id
                    print(f"✅ Mapped: {login} -> {user_id} (tool: {tool})")
                else:
                    unmapped_logins.append(login)
                    print(f"❌ Unmapped: {login} (tool: {tool})")
            else:
                unmapped_logins.append(key)
                print(f"❌ Unmapped (old format): {key}")
        
        print(f"\nSummary:")
        print(f"  - Mapped logins: {len(mapped_logins)}")
        print(f"  - Unmapped logins: {len(unmapped_logins)}")
        
        if mapped_logins:
            print(f"\nMapped logins:")
            for login, user_id in mapped_logins.items():
                print(f"  - {login} -> {user_id}")
        
        if unmapped_logins:
            print(f"\nUnmapped logins:")
            for login in unmapped_logins:
                print(f"  - {login}")

        return True

    except Exception as e:
        print(f"❌ Error checking mapping data: {e}")
        return False

if __name__ == "__main__":
    check_mapping_data()
