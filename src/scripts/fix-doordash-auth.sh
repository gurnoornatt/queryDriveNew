#!/bin/bash

# Define colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print banner
echo -e "${GREEN}===================================${NC}"
echo -e "${GREEN}   DoorDash Auth Fix Script       ${NC}"
echo -e "${GREEN}===================================${NC}"

# Check if running as root
if [ "$(id -u)" == "0" ]; then
  echo -e "${RED}This script should not be run as root. Please run it as your regular user.${NC}"
  exit 1
fi

echo -e "\n${YELLOW}Step 1: Checking for existing processes...${NC}"

# Function to kill processes on port 3000 (macOS/Linux)
kill_port_process() {
  # Find PID using the port
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    PID=$(lsof -i :3000 -t)
  else
    # Linux
    PID=$(netstat -nlp | grep :3000 | awk '{print $7}' | cut -d'/' -f1)
  fi
  
  if [ -z "$PID" ]; then
    echo -e "${GREEN}No process found using port 3000.${NC}"
    return 0
  fi
  
  echo -e "${YELLOW}Found process(es) using port 3000: $PID${NC}"
  
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

echo -e "\n${YELLOW}Step 2: Cleaning node_modules and package-lock.json...${NC}"
rm -rf node_modules
rm -f package-lock.json

echo -e "\n${YELLOW}Step 3: Updating package.json to use DoorDash SDK v0.4.6...${NC}"
# Use sed to replace the SDK version in package.json
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sed -i '' 's/"@doordash\/sdk": "\^0\.6\.13"/"@doordash\/sdk": "0.4.6"/g' package.json
else
  # Linux
  sed -i 's/"@doordash\/sdk": "\^0\.6\.13"/"@doordash\/sdk": "0.4.6"/g' package.json
fi

echo -e "\n${YELLOW}Step 4: Reinstalling dependencies...${NC}"
npm install

echo -e "\n${YELLOW}Step 5: Building the project...${NC}"
npm run build

echo -e "\n${YELLOW}Step 6: Running authentication check...${NC}"
npm run test:direct-api

echo -e "\n${GREEN}===================================${NC}"
echo -e "${GREEN}   Fix Process Complete             ${NC}"
echo -e "${GREEN}===================================${NC}"
echo -e "\n${YELLOW}Next Steps:${NC}"
echo -e "1. Check if the authentication is now working"
echo -e "2. If still getting errors, you need to regenerate your API keys in the DoorDash Developer Portal"
echo -e "3. Update your .env file with the new credentials"
echo -e "4. Run the restaurant API test again: npm run test:restaurant"
echo -e "\nFor more details, see the AUTHENTICATION-FIX.md document." 