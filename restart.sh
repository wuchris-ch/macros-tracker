#!/bin/bash

# Calorie Tracker App Restart Script
# Kills any existing processes on ports 3001 and 3002, then starts fresh

echo "🔄 Restarting Calorie Tracker App..."
echo ""

# Kill any process on port 3001 (frontend)
echo "🛑 Stopping any processes on port 3001..."
lsof -ti:3001 | xargs kill -9 2>/dev/null && echo "   ✓ Killed process on port 3001" || echo "   ℹ No process found on port 3001"

# Kill any process on port 3002 (backend)
echo "🛑 Stopping any processes on port 3002..."
lsof -ti:3002 | xargs kill -9 2>/dev/null && echo "   ✓ Killed process on port 3002" || echo "   ℹ No process found on port 3002"

# Wait a moment for ports to be released
echo ""
echo "⏳ Waiting for ports to be released..."
sleep 2

# Start the app
echo ""
exec ./start.sh

