#!/bin/bash

# Define colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print banner
echo -e "${GREEN}===================================${NC}"
echo -e "${GREEN}   Starting Server Safely Script   ${NC}"
echo -e "${GREEN}===================================${NC}"

# Define port (default: 3000)
PORT=${PORT:-3000}

echo -e "\n${YELLOW}Step 1: Checking for processes on port $PORT...${NC}"

# Function to kill processes on the port (macOS/Linux)
kill_port_process() {
  # Find PID using the port
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    PID=$(lsof -i :$PORT -t)
  else
    # Linux
    PID=$(netstat -nlp | grep :$PORT | awk '{print $7}' | cut -d'/' -f1)
  fi
  
  if [ -z "$PID" ]; then
    echo -e "${GREEN}No process found using port $PORT.${NC}"
    return 0
  fi
  
  echo -e "${YELLOW}Found process(es) using port $PORT: $PID${NC}"
  
  # Kill the process
  echo -e "${YELLOW}Killing process(es)...${NC}"
  for pid in $PID; do
    if kill -9 $pid > /dev/null 2>&1; then
      echo -e "${GREEN}Process $pid successfully terminated.${NC}"
    else
      echo -e "${RED}Failed to kill process $pid.${NC}"
      return 1
    fi
  done
  
  return 0
}

# Kill processes using the port
kill_port_process
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to kill all processes on port $PORT.${NC}"
  echo -e "${RED}Please check manually and try again.${NC}"
  exit 1
fi

echo -e "\n${YELLOW}Step 2: Checking DoorDash credentials...${NC}"
ts-node src/scripts/check-doordash-credentials.ts
if [ $? -ne 0 ]; then
  echo -e "${RED}DoorDash credential check failed.${NC}"
  echo -e "${RED}Please fix your credentials and try again.${NC}"
  exit 1
fi

echo -e "\n${YELLOW}Step 3: Starting server...${NC}"
npm run start

# If server terminated with error
if [ $? -ne 0 ]; then
  echo -e "${RED}Server process terminated unexpectedly.${NC}"
  exit 1
fi 