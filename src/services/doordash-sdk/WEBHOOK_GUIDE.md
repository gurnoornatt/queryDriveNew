# DoorDash Webhook Integration Guide

This guide covers how to set up, test, and handle DoorDash webhook events in your application.

## Overview

DoorDash provides webhook notifications to keep your application updated about the status of deliveries. Webhooks are HTTP callbacks that allow DoorDash to send real-time updates to your application whenever there's a change in the delivery status.

## Webhook Events

DoorDash sends webhook events for various delivery lifecycle events, including:

- `delivery.status_update`: Sent when the delivery status changes (e.g., created, picked_up, delivered)
- `delivery.quote_expired`: Sent when a delivery quote expires
- `delivery.created`: Sent when a delivery is created
- `delivery.cancelled`: Sent when a delivery is canceled

## Setting Up Webhook Endpoint

Our application already has a webhook endpoint set up at `/webhooks/doordash`. This endpoint:

1. Receives POST requests from DoorDash
2. Verifies the webhook signature
3. Processes the webhook data
4. Returns a 200 OK response to acknowledge receipt

## Testing Your Webhook Endpoint

### Local Testing

To test your webhook endpoint locally:

1. Start your application server:
   ```
   npm run start
   ```

2. Use ngrok to expose your local server:
   ```
   ngrok http 3000
   ```

3. Use the provided testing script:
   ```
   npm run test:doordash-webhook -- https://your-ngrok-url
   ```

### Manual Testing with curl

You can also test the webhook endpoint manually with curl:

```bash
# Test the GET endpoint (browser-friendly)
curl https://your-ngrok-url/webhooks/doordash

# Test the POST endpoint with sample webhook data
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-DoorDash-Signature: test-signature" \
  -H "X-DoorDash-Timestamp: $(date +%s)" \
  -d '{"event_type":"delivery.status_update", "delivery_id":"test-id", "external_delivery_id":"test-ext-id", "status":"delivered"}' \
  https://your-ngrok-url/webhooks/doordash
```

## Webhook Signature Verification

DoorDash secures webhook requests by including a signature in the `X-DoorDash-Signature` header. Our implementation verifies this signature to ensure the webhook comes from DoorDash:

```typescript
// Verify webhook signature
const signature = req.headers['x-doordash-signature'];
const timestamp = req.headers['x-doordash-timestamp'];
const rawBody = JSON.stringify(req.body);

if (!signature || !timestamp) {
  return res.status(401).json({ error: 'Missing required headers' });
}

// Implementation in src/clients/doordashSdk.ts
const isValid = doordashClient.verifyWebhookSignature(signature, timestamp, rawBody);
if (!isValid) {
  return res.status(401).json({ error: 'Invalid webhook signature' });
}
```

## Processing Webhook Data

After verifying the signature, our application processes the webhook data:

1. Parses the webhook JSON
2. Identifies the event type
3. Processes the data according to the event type
4. Updates the delivery status in the database (if applicable)

## Simulating Webhook Events with DoorDash Simulator

To simulate webhook events:

1. Run the test script:
   ```
   npm run test:doordash
   ```

2. Visit the [DoorDash Developer Portal Simulator](https://developer.doordash.com/portal/simulator)

3. Find your delivery by ID and use the "Advance" button to simulate status changes

4. Monitor your server logs to see the incoming webhook events

## Common Webhook Status Values

DoorDash webhooks include a `status` field with values such as:

- `created`: Delivery created, Dasher not yet assigned
- `arrived_at_pickup`: Dasher arrived at the pickup location
- `picked_up`: Dasher picked up the order
- `arrived_at_dropoff`: Dasher arrived at the dropoff location
- `delivered`: Delivery completed successfully
- `canceled`: Delivery was canceled
- `returned`: Order was returned to the merchant

## Troubleshooting

### Missing Webhook Events

If you're not receiving webhook events:

1. Ensure your ngrok session is active
2. Check that the webhook URL in your test script matches your ngrok URL
3. Verify that your server is listening for requests
4. Check server logs for any errors in webhook processing

### Invalid Signature Errors

If you're getting signature verification errors:

1. Check that you're using the correct DoorDash Developer Key
2. Ensure the timestamp is fresh (within 5 minutes of the request)
3. Verify that the raw body is being parsed correctly

### 404 Errors

If you get a "Cannot GET /webhooks/doordash" error when accessing the URL in a browser:
- This is expected for GET requests if you haven't set up a GET handler
- The webhook endpoint is designed for POST requests from DoorDash

## Webhook Configuration in Production

For production use:

1. Set up a permanent webhook URL (not ngrok)
2. Configure this URL in the DoorDash Developer Portal
3. Ensure your server has proper error handling and logging
4. Consider implementing retry logic for failed webhook processing

## Additional Resources

- [DoorDash Drive API Documentation](https://developer.doordash.com/en-US/docs/drive/reference/delivery/)
- [Webhook Security Best Practices](https://developer.doordash.com/en-US/docs/drive/tutorials/webhook-verification/) 