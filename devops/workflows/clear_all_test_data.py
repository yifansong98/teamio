import firebase_admin
from firebase_admin import credentials, db

def clear_all_test_data(team_id):
    """
    Clear all test data for a team.
    """
    try:
        # Initialize Firebase Admin SDK
        cred = credentials.Certificate("../../teamio-backend/FIREBASE_SERVICE_CREDENTIALS.json")
        firebase_admin.initialize_app(cred, {
            'databaseURL': 'https://teamio-test-default-rtdb.firebaseio.com'
        })
        print("Firebase app initialized successfully.")

        # Clear all logins for the team
        logins_ref = db.reference(f'teams/{team_id}/logins')
        logins_ref.delete()
        print(f"✅ Cleared all logins for team {team_id}")

        # Clear all contributions for the team
        contributions_ref = db.reference('contributions')
        contributions_data = contributions_ref.get() or {}
        
        contributions_to_clear = []
        for contrib_id, contrib_data in contributions_data.items():
            if isinstance(contrib_data, dict) and contrib_data.get('team_id') == team_id:
                contributions_to_clear.append(contrib_id)
            # Also clear nested contributions
            elif isinstance(contrib_data, dict) and contrib_id == team_id:
                contributions_to_clear.append(contrib_id)
        
        for contrib_id in contributions_to_clear:
            contributions_ref.child(contrib_id).delete()
        
        if contributions_to_clear:
            print(f"✅ Cleared {len(contributions_to_clear)} contributions for team {team_id}")
        else:
            print(f"✅ No contributions found for team {team_id}")

        # Clear log_data for the team
        log_data_ref = db.reference('log_data')
        log_data = log_data_ref.get() or {}
        
        total_cleared = 0
        
        # Clear google_docs log data
        if 'google_docs' in log_data:
            google_docs_data = log_data['google_docs']
            for metric in ['revision', 'comment']:
                if metric in google_docs_data:
                    metric_data = google_docs_data[metric]
                    for contrib_id, contrib_data in metric_data.items():
                        if isinstance(contrib_data, dict) and contrib_data.get('team_id') == team_id:
                            log_data_ref.child(f'google_docs/{metric}/{contrib_id}').delete()
                            total_cleared += 1
        
        if total_cleared > 0:
            print(f"✅ Cleared {total_cleared} log_data entries for team {team_id}")
        else:
            print(f"✅ No log_data found for team {team_id}")

        print(f"\n🎉 All test data cleared for team {team_id}")
        return True

    except Exception as e:
        print(f"❌ Error clearing test data: {e}")
        return False

if __name__ == "__main__":
    import sys
    team_id = sys.argv[1] if len(sys.argv) > 1 else "vitals"
    clear_all_test_data(team_id)
