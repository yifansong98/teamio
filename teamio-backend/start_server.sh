#!/bin/bash
# Unified TeamIO Server Startup Script

echo "Starting TeamIO Unified Server..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Install Playwright browsers
echo "Installing Playwright browsers..."
python setup_playwright.py

# Start the unified server
echo "Starting unified server on port 8000..."
python unified_server.py
