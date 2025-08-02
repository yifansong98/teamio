import os
import json
from slack_sdk import WebClient
from datetime import datetime
from slack_sdk.errors import SlackApiError
import logging

# Enter your bot token
SLACK_BOT_TOKEN = ""

client = WebClient(token=SLACK_BOT_TOKEN)

def list_channels():
    """
        Fetches and prints all available Slack channels the bot has access to.
    """
    try:
        response = client.conversations_list()
        channels = response.get("channels", [])
        if not channels:
            print("No channels found or access restricted.")
            return []
        
        print("\nAvailable Channels:")
        for channel in channels:
            print(f"Name: {channel['name']} - ID: {channel['id']}")
        return channels
    
    except SlackApiError as e:
        logging.error(f"Error fetching channels: {e.response['error']}")
        return []


def get_channel_messages(channel_id, limit=100):
    """
        Fetches recent messages from a given Slack channel ID. 
        You can use the limit parameter to limit the number of messages returned
    """
    try:
        print("here")
        response = client.conversations_history(channel=channel_id, limit=limit)
        messages = response.get("messages", [])
        if not messages:
            print(f"No messages found in channel {channel_id}.")
            return []
        
        return messages
    
    except SlackApiError as e:
        logging.error(f"Error fetching messages: {e.response['error']}")
        return []


def save_messages_to_json(channel_id, messages):
    """
        Saves the extracted messages to a JSON file.
    """
    file_name = f"slack_message_history_{channel_id}.json"

    with open(file_name, "w", encoding="utf-8") as json_file:
        json.dump(messages, json_file, indent=4)

    print(f"\n Messages saved to {file_name}")

def get_user_info(user_id):
    """
        Fetches the real name or email of a user based on their Slack ID.
    """
    try:
        response = client.users_info(user=user_id)
        user_info = response.get("user", {})
        return user_info.get("real_name", user_info.get("profile", {}).get("email", "Unknown User"))
    except SlackApiError as e:
        print(f"Error fetching user info for {user_id}: {e.response['error']}")
        return "Unknown User"



def save_messages(channel_id):
    """
    Fetches and saves messages from the specified Slack channel.

    """
    messages = get_channel_messages(channel_id)

    if messages:
        print(f"\nMessages from Channel {channel_id}:")
        formatted_messages = []
        
        for msg in messages:
            readable_timestamp = datetime.utcfromtimestamp(float(msg.get("ts", "0"))).strftime('%Y-%m-%d %H:%M:%S')
            reactions = []
            if "reactions" in msg:
                for reaction in msg["reactions"]:
                    user_ids = reaction["users"]
                    user_names = [get_user_info(user) for user in user_ids]
                    reactions.append({
                        "emoji": reaction["name"],
                        "count": reaction["count"],
                        "user_ids": user_ids, 
                        "user_names": user_names
                    })
            user_id = msg.get("user", "Unknown")
            user_name = get_user_info(user_id)
            message_data = {
                "timestamp": readable_timestamp,
                "user_id": user_id,
                "user_name": user_name,
                "message": msg.get("text", "[No Text]"),
                "reactions": reactions
            }
            formatted_messages.append(message_data)
            # print(f"{message_data['timestamp']}: {message_data['user_id']} - {message_data['message']}")
        save_messages_to_json(channel_id, formatted_messages)
    else:
        print("No messages to display or save.")


def main():
    """
    Main function to list channels and fetch messages from a specified channel.
    """
    channels = list_channels()
    
    if not channels:
        return  

    # Prompt user for a channel ID
    channel_id = input("\nEnter the Channel ID to fetch messages: ").strip()

    if channel_id:
        save_messages(channel_id)
    else:
        print("No channel ID entered. Exiting...")


if __name__ == "__main__":
    main()