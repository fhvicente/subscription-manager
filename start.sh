#!/bin/sh
# Create data directory
mkdir -p /app/backend/data
echo "Data directory created at /app/backend/data"
ls -la /app/backend/data

# Start backend and initialize database
cd /app/backend
echo "Working directory: $(pwd)"
echo "Initializing database..."
node src/db/init.js
echo "Database initialization completed."
echo "Checking database file..."
ls -la /app/backend/data
echo "Starting backend..."
node src/index.js &
BACKEND_PID=$!

# Start frontend
cd /app/frontend
echo "Starting frontend..."
node server.js &
FRONTEND_PID=$!

# Start nginx
echo "Starting nginx..."
nginx -g "daemon off;" &
NGINX_PID=$!

# Handle termination
trap "kill $BACKEND_PID $FRONTEND_PID $NGINX_PID; exit" TERM INT

# Keep script running
wait 