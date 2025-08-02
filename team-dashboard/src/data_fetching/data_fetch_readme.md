The following is a guide on how to run the data fetching scripts for slack, google drive and github.


First, navigate to the DataFetching Folder.

cd teamio
cd team-dashboard
cd src
cd data_fetching

For Slack:

Before performing the following steps, provide the bot token for the Slack workspace you are trying to get data from.

1. Run the command: python fetch_slack.py

2. You will be given a list of slack channels and their channel ids. Pick the channel id for the channel you want to get data from and enter it when you see the following prompt:

    Enter the Channel ID to fetch messages:

3. The data will be saved to a json file in the data_fetching folder called slack_message_history_<channel_id>.json


For Google Drive:

Before performing the following steps, provide the ID of the file whose data you're trying to collect.

1. Run the command: python fetch_gdrive.py

2. The data will be saved to a json file in the data_fetching folder called google_doc_history_<file_id>.json

You can run the code on different files by changing the file_id.


For Github:

Before performing the following steps, provide the name of the repo, organization and the token.

1. Run the command: python fetch_github.py

2. The data will be saved to a json file in the data_fetching folder called github_history_<repo_name>.json

