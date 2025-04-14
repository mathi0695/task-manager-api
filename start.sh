#!/bin/bash

# Create database if it doesn't exist
echo "Checking if database exists..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USERNAME -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USERNAME -c "CREATE DATABASE $DB_NAME"
echo "Database check completed"

# Initialize database
echo "Initializing database..."
npm run db:init

# Start server
echo "Starting server..."
if [ "$NODE_ENV" = "production" ]; then
  npm start
else
  npm run dev
fi
