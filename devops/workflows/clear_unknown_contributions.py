import firebase_admin
from firebase_admin import credentials, db

def clear_unknown_contributions():
    """
    Clear contributions with team_id 'unknown' or other problematic values.
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
        
        print(f"\n=== Clearing Unknown Contributions ===")
        print(f"Total contributions before: {len(contributions_data)}")
        
        # Identify contributions to clear
        contributions_to_clear = []
        for contrib_id, contrib_data in contributions_data.items():
            if isinstance(contrib_data, dict):
                team_id = contrib_data.get('team_id', 'unknown')
                # Clear contributions with unknown team_id or other problematic values
                if team_id in ['unknown', 'vitals', 'docstest2', 'docstest3', 'docstest4', 'docstest5', 'leisha60']:
                    contributions_to_clear.append(contrib_id)
                    print(f"  Will clear: {contrib_id} (team_id: {team_id})")
        
        # Clear the contributions
        if contributions_to_clear:
            for contrib_id in contributions_to_clear:
                contributions_ref.child(contrib_id).delete()
            print(f"\n✅ Cleared {len(contributions_to_clear)} contributions")
        else:
            print("\n✅ No unknown contributions found to clear")
        
        # Verify the result
        updated_contributions = contributions_ref.get() or {}
        print(f"Total contributions after: {len(updated_contributions)}")
        
        if updated_contributions:
            print(f"\nRemaining contributions:")
            for contrib_id, contrib_data in updated_contributions.items():
                if isinstance(contrib_data, dict):
                    team_id = contrib_data.get('team_id', 'unknown')
                    tool = contrib_data.get('tool', 'unknown')
                    print(f"  - {contrib_id}: team_id={team_id}, tool={tool}")
        
        return True

    except Exception as e:
        print(f"❌ Error clearing unknown contributions: {e}")
        return False

if __name__ == "__main__":
    clear_unknown_contributions()
