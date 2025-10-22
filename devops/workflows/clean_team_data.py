import firebase_admin
from firebase_admin import credentials, db
import argparse

def clean_team_data(team_id):
    """
    Clean all log data and contributions for a specific team while preserving team and user info.
    """
    try:
        # Initialize Firebase Admin SDK
        cred = credentials.Certificate("../../teamio-backend/FIREBASE_SERVICE_CREDENTIALS.json")
        firebase_admin.initialize_app(cred, {
            'databaseURL': 'https://teamio-test-default-rtdb.firebaseio.com'
        })
        print("Firebase app initialized successfully.")

        # Get references to different parts of the database
        teams_ref = db.reference('teams')
        users_ref = db.reference('users')
        contributions_ref = db.reference('contributions')
        log_data_ref = db.reference('log_data')

        print(f"Starting cleanup for team: {team_id}")

        # 1. Clean contributions for the team
        print("Cleaning contributions...")
        contributions_data = contributions_ref.get() or {}
        contributions_to_delete = []
        
        for contrib_id, contrib_data in contributions_data.items():
            if contrib_data.get('team_id') == team_id:
                contributions_to_delete.append(contrib_id)
        
        for contrib_id in contributions_to_delete:
            contributions_ref.child(contrib_id).delete()
            print(f"  Deleted contribution: {contrib_id}")
        
        print(f"Deleted {len(contributions_to_delete)} contributions for team {team_id}")

        # 2. Clean log_data for the team
        print("Cleaning log_data...")
        log_data = log_data_ref.get() or {}
        log_data_deleted = 0
        
        # Clean google_docs log data
        if 'google_docs' in log_data:
            google_docs_data = log_data['google_docs']
            for metric in ['revision', 'comment']:
                if metric in google_docs_data:
                    metric_data = google_docs_data[metric]
                    for contrib_id, contrib_data in metric_data.items():
                        if contrib_data.get('team_id') == team_id:
                            log_data_ref.child(f'google_docs/{metric}/{contrib_id}').delete()
                            log_data_deleted += 1
                            print(f"  Deleted log_data: google_docs/{metric}/{contrib_id}")
        
        # Clean github log data
        if 'github' in log_data:
            github_data = log_data['github']
            for metric in ['commit', 'pull_request']:
                if metric in github_data:
                    metric_data = github_data[metric]
                    for contrib_id, contrib_data in metric_data.items():
                        if contrib_data.get('team_id') == team_id:
                            log_data_ref.child(f'github/{metric}/{contrib_id}').delete()
                            log_data_deleted += 1
                            print(f"  Deleted log_data: github/{metric}/{contrib_id}")
        
        print(f"Deleted {log_data_deleted} log_data entries for team {team_id}")

        # 3. Clean team-specific data but preserve team structure
        print("Cleaning team-specific data...")
        team_ref = teams_ref.child(team_id)
        team_data = team_ref.get()
        
        if team_data:
            # Preserve team structure but clean data fields
            preserved_fields = ['members', 'logins']  # Keep these fields
            fields_to_clean = []
            
            for field in team_data.keys():
                if field not in preserved_fields:
                    fields_to_clean.append(field)
            
            for field in fields_to_clean:
                team_ref.child(field).delete()
                print(f"  Cleaned team field: {field}")
            
            # Clean logins data but keep the structure
            if 'logins' in team_data:
                logins_data = team_data['logins']
                for login_id, login_data in logins_data.items():
                    # Keep login structure but clean contribution data
                    if isinstance(login_data, dict):
                        for key in list(login_data.keys()):
                            if key not in ['email', 'name', 'user_id']:  # Preserve basic info
                                team_ref.child(f'logins/{login_id}/{key}').delete()
                                print(f"  Cleaned login data: {login_id}/{key}")

        # 4. Verify what's preserved
        print("\nVerification - Preserved data:")
        
        # Check team structure
        team_data_after = team_ref.get()
        if team_data_after:
            print(f"  Team {team_id} structure preserved:")
            print(f"    - Members: {len(team_data_after.get('members', {}))}")
            print(f"    - Logins: {len(team_data_after.get('logins', {}))}")
        
        # Check users
        users_data = users_ref.get() or {}
        team_users = [uid for uid, user_data in users_data.items() if user_data.get('team_id') == team_id]
        print(f"  Users preserved: {len(team_users)}")
        
        print(f"\n✅ Cleanup completed for team {team_id}")
        print(f"   - Contributions deleted: {len(contributions_to_delete)}")
        print(f"   - Log data entries deleted: {log_data_deleted}")
        print(f"   - Team and user structure preserved")

    except Exception as e:
        print(f"❌ Error during cleanup: {e}")

def main():
    parser = argparse.ArgumentParser(description="Clean log data for a specific team while preserving team and user info")
    parser.add_argument("--team-id", required=True, help="Team ID to clean (e.g., 'vitals')")
    parser.add_argument("--confirm", action="store_true", help="Confirm the cleanup operation")
    
    args = parser.parse_args()
    
    if not args.confirm:
        print(f"⚠️  This will clean all log data and contributions for team '{args.team_id}'")
        print("   Team and user information will be preserved.")
        print("   Use --confirm flag to proceed with the cleanup.")
        return
    
    clean_team_data(args.team_id)

if __name__ == "__main__":
    main()
