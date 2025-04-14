#!/bin/bash

# Set base URL
BASE_URL="http://localhost:3001"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to make API requests
function make_request() {
  local method=$1
  local endpoint=$2
  local data=$3
  local token=$4
  local headers=""

  if [ ! -z "$token" ]; then
    headers="-H \"Authorization: Bearer $token\""
  fi

  if [ ! -z "$data" ]; then
    echo -e "${YELLOW}Making $method request to $endpoint with data: $data${NC}"
    response=$(curl -s -X $method -H "Content-Type: application/json" $headers -d "$data" $BASE_URL$endpoint)
  else
    echo -e "${YELLOW}Making $method request to $endpoint${NC}"
    response=$(curl -s -X $method -H "Content-Type: application/json" $headers $BASE_URL$endpoint)
  fi

  echo -e "${GREEN}Response:${NC}"
  echo $response | jq '.'
  echo ""

  echo $response
}

# Test health check
echo -e "${YELLOW}Testing health check...${NC}"
make_request "GET" "/health"

# Register a user
echo -e "${YELLOW}Registering a user...${NC}"
register_response=$(make_request "POST" "/api/auth/register" '{"username":"testuser","email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}')

# Extract access token
access_token=$(echo $register_response | jq -r '.data.accessToken')
refresh_token=$(echo $register_response | jq -r '.data.refreshToken')

echo -e "${GREEN}Access Token:${NC} $access_token"
echo -e "${GREEN}Refresh Token:${NC} $refresh_token"

# Get current user
echo -e "${YELLOW}Getting current user...${NC}"
make_request "GET" "/api/users/me" "" "$access_token"

# Create a category
echo -e "${YELLOW}Creating a category...${NC}"
category_response=$(make_request "POST" "/api/categories" '{"name":"Work","description":"Work-related tasks","color":"#FF5733","icon":"briefcase"}' "$access_token")

# Extract category ID
category_id=$(echo $category_response | jq -r '.data.category.id')
echo -e "${GREEN}Category ID:${NC} $category_id"

# Create a task
echo -e "${YELLOW}Creating a task...${NC}"
task_response=$(make_request "POST" "/api/tasks" "{\"title\":\"Sample Task\",\"description\":\"This is a sample task\",\"status\":\"not_started\",\"priority\":\"medium\",\"dueDate\":\"2023-12-31T23:59:59Z\",\"categoryId\":\"$category_id\"}" "$access_token")

# Extract task ID
task_id=$(echo $task_response | jq -r '.data.task.id')
echo -e "${GREEN}Task ID:${NC} $task_id"

# Get all tasks
echo -e "${YELLOW}Getting all tasks...${NC}"
make_request "GET" "/api/tasks" "" "$access_token"

# Get task by ID
echo -e "${YELLOW}Getting task by ID...${NC}"
make_request "GET" "/api/tasks/$task_id" "" "$access_token"

# Update task
echo -e "${YELLOW}Updating task...${NC}"
make_request "PATCH" "/api/tasks/$task_id" '{"status":"in_progress","priority":"high"}' "$access_token"

# Add a comment
echo -e "${YELLOW}Adding a comment...${NC}"
comment_response=$(make_request "POST" "/api/comments" "{\"content\":\"This is a comment\",\"taskId\":\"$task_id\"}" "$access_token")

# Extract comment ID
comment_id=$(echo $comment_response | jq -r '.data.comment.id')
echo -e "${GREEN}Comment ID:${NC} $comment_id"

# Get comments for task
echo -e "${YELLOW}Getting comments for task...${NC}"
make_request "GET" "/api/comments?taskId=$task_id" "" "$access_token"

# Get task statistics
echo -e "${YELLOW}Getting task statistics...${NC}"
make_request "GET" "/api/stats/tasks" "" "$access_token"

# Get productivity statistics
echo -e "${YELLOW}Getting productivity statistics...${NC}"
make_request "GET" "/api/stats/productivity" "" "$access_token"

echo -e "${GREEN}API test completed!${NC}"
