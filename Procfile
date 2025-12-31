web: sh -c 'pwd && ls -la && if [ ! -f package.json ]; then if [ -f /app/package.json ]; then cd /app; elif [ -f ../package.json ]; then cd ..; else PKG=$(find /app -name package.json 2>/dev/null | head -1); [ -n "$PKG" ] && cd "$(dirname "$PKG")"; fi; fi && pwd && npm start'

