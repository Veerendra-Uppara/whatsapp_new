#!/bin/sh
# Find the directory containing package.json and start the server
# Debug: Show current directory and files
echo "Current directory: $(pwd)"
echo "Files in current directory:"
ls -la

# Check if package.json exists in current directory
if [ ! -f "package.json" ]; then
    echo "ERROR: package.json not found in $(pwd)"
    echo "Searching for package.json in parent directories..."
    # Try to find package.json
    if [ -f "../package.json" ]; then
        cd .. || exit 1
        echo "Found package.json in parent directory"
    elif [ -f "../../package.json" ]; then
        cd ../.. || exit 1
        echo "Found package.json in grandparent directory"
    else
        echo "ERROR: Could not find package.json"
        exit 1
    fi
fi

echo "Found package.json in $(pwd), starting server..."
npm start

