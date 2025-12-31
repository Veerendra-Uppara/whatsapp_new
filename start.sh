#!/bin/sh
# Find the directory containing package.json and start the server
# Debug: Show current directory and files
echo "=== Starting Container ==="
echo "Current directory: $(pwd)"
echo "Files in current directory:"
ls -la

# Check if package.json exists in current directory
if [ ! -f "package.json" ]; then
    echo "package.json not found in $(pwd)"
    echo "Searching for package.json..."
    
    # Try common locations
    if [ -f "../package.json" ]; then
        cd .. || exit 1
        echo "Found package.json in parent directory: $(pwd)"
    elif [ -f "../../package.json" ]; then
        cd ../.. || exit 1
        echo "Found package.json in grandparent directory: $(pwd)"
    elif [ -f "/app/package.json" ]; then
        cd /app || exit 1
        echo "Found package.json in /app: $(pwd)"
    else
        # Search for package.json
        echo "Searching for package.json..."
        PKG_PATH=$(find /app -name "package.json" -type f 2>/dev/null | head -1)
        if [ -n "$PKG_PATH" ]; then
            cd "$(dirname "$PKG_PATH")" || exit 1
            echo "Found package.json at: $(pwd)"
        else
            echo "ERROR: Could not find package.json anywhere"
            echo "Searched in: $(pwd), /app, and parent directories"
            exit 1
        fi
    fi
fi

echo "=== Starting Server ==="
echo "Working directory: $(pwd)"
echo "package.json location: $(pwd)/package.json"
npm start

