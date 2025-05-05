#!/bin/bash

# Usage: ./test-doordash-webhook.sh https://646e-138-202-198-238.ngrok-free.app
# Or: npm run test:doordash-webhook -- https://646e-138-202-198-238.ngrok-free.app

# Get the ngrok URL from command line argument or use default
NGROK_URL=${1:-"https://646e-138-202-198-238.ngrok-free.app"}
WEBHOOK_ENDPOINT="${NGROK_URL}/webhooks/doordash"

echo "Testing DoorDash webhook endpoint: ${WEBHOOK_ENDPOINT}"

# First, test with a GET request (what browsers would do)
echo "Testing GET request..."
curl -s "${WEBHOOK_ENDPOINT}"

# Now test with a POST request with fake webhook data
echo -e "\nTesting POST request with fake webhook data..."
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "X-DoorDash-Signature: test-signature" \
  -H "X-DoorDash-Timestamp: $(date +%s)" \
  -d '{"event_type":"delivery.status_update", "delivery_id":"test-12345", "external_delivery_id":"test-ext-12345", "status":"delivered"}' \
  "${WEBHOOK_ENDPOINT}"

# Test missing headers
echo -e "\nTesting POST request with missing headers (should return 401)..."
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"event_type":"delivery.status_update", "delivery_id":"test-12345"}' \
  "${WEBHOOK_ENDPOINT}"

echo -e "\nDone testing DoorDash webhook endpoint." 