from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Configuration variables
FIREBASE_DATABASE_URL = os.getenv('FIREBASE_DATABASE_URL', 'https://teamio-test-default-rtdb.firebaseio.com')