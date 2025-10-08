#!/bin/bash

# Calorie Tracker App Startup Script
# This script starts both the backend and frontend servers

echo "🚀 Starting Calorie Tracker App..."
echo ""

# Function to handle cleanup on script exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}

# Set up trap to handle Ctrl+C
trap cleanup SIGINT SIGTERM

# Get the script directory to ensure we're in the right place
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Start backend server
echo "📡 Starting backend server on port 3002..."
(cd backend && npm run dev) &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start frontend from project root
echo "🌐 Starting frontend server on port 3001..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers are starting up!"
echo "📱 Frontend (local):    http://localhost:3001"
echo "📱 Frontend (network):  http://192.168.1.67:3001"
echo "🔧 Backend (local):     http://localhost:3002"
echo "🔧 Backend (network):   http://192.168.1.67:3002"
echo ""
echo "🌐 Access from other devices on your network:"
echo "   http://192.168.1.67:3001"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID