#!/bin/bash

# Set base URL
BASE_URL="http://localhost:3001"

# Generate a unique email
TIMESTAMP=$(date +%s)
UNIQUE_EMAIL="test$TIMESTAMP@example.com"
UNIQUE_USERNAME="testuser$TIMESTAMP"

# Register a user and get token
echo "Registering a user with email: $UNIQUE_EMAIL"
register_response=$(curl -s -X POST -H "Content-Type: application/json" -d "{\"username\":\"$UNIQUE_USERNAME\",\"email\":\"$UNIQUE_EMAIL\",\"password\":\"password123\",\"firstName\":\"Test\",\"lastName\":\"User\"}" $BASE_URL/api/auth/register)

# Print the response for debugging
echo "Register response: $register_response"

# Extract access token using jq if available
if command -v jq &> /dev/null; then
    access_token=$(echo $register_response | jq -r '.data.accessToken // empty')
    echo "Access Token (jq): $access_token"
else
    # Fallback to grep/cut if jq is not available
    access_token=$(echo $register_response | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    echo "Access Token (grep): $access_token"
fi

# Test notifications endpoint with token
echo "Getting notifications..."
curl -s -X GET -H "Content-Type: application/json" -H "Authorization: Bearer $access_token" $BASE_URL/api/notifications | jq .
