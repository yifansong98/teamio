The following is a guide on how to run the data fetching scripts for slack, google drive and github.


First, navigate to the DataFetching Folder.

cd teamio
cd team-dashboard
cd src
cd DataFetching

For Slack:

1. Run the command: python fetch_slack_test.py

2. You will be given a list of slack channels and their channel ids. Pick the channel id for the channel you want to get data from and enter it when you see the following prompt:

    Enter the Channel ID to fetch messages:

3. The data will be saved to a json file in the DataFetching folder called slack_messages_<channel_id>.json


For Google Drive:

1. Run the command: python fetch_google_drive_test.py

2. The data will be saved to a json file in the DataFetching folder called google_doc_history.json

You can run the code on different files by changing the file_id.


For Github:

1. Run the command: python fetch_github_test.py

2. The data will be saved to a json file in the DataFetching folder called commit_history_<repo_name>.json

If you change the repo name in the code, it will fetch data accordingly.