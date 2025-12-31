#!/bin/bash
# Find the directory containing package.json and start the server
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR" || exit 1

# Debug: Show current directory and files
echo "Current directory: $(pwd)"
echo "Files in current directory:"
ls -la

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "ERROR: package.json not found in $(pwd)"
    echo "Searching for package.json..."
    find / -name "package.json" -type f 2>/dev/null | head -5
    exit 1
fi

echo "Found package.json, starting server..."
npm start

