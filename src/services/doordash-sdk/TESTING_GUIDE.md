# DoorDash SDK Testing Guide

This guide provides step-by-step instructions for testing your DoorDash Drive SDK integration using the DoorDash simulator.

## Prerequisites

Before you begin testing, make sure you have:

1. **DoorDash Developer Account** - Access to the DoorDash Developer Portal
2. **API Credentials** - Your `DD_DEVELOPER_ID`, `DD_KEY_ID`, and `DD_SIGNING_SECRET` from the Developer Portal
3. **Environment Variables** - These credentials should be set in your `.env` file
4. **Required Dependencies** - The `@doordash/sdk` and `uuid` packages should be installed

## Step 1: Set Up Your Environment

1. Verify that your `.env` file contains the following variables:
   ```
   DD_DEVELOPER_ID=your_doordash_developer_id
   DD_KEY_ID=your_doordash_key_id
   DD_SIGNING_SECRET=your_doordash_signing_secret
   ```

2. Make sure the required packages are installed:
   ```bash
   npm install @doordash/sdk uuid
   ```

## Step 2: Start Your Local Server (For Webhook Testing)

If you want to test webhook events from DoorDash, you need to run your local server:

```bash
npm run dev
```

## Step 3: Expose Your Local Server for Webhooks (Optional)

To receive webhook events from DoorDash, you need to expose your local server to the internet:

1. Install ngrok if you haven't already:
   ```bash
   npm install -g ngrok
   ```

2. Start ngrok to expose your server:
   ```bash
   ngrok http 3000
   ```

3. Copy the forwarding URL (e.g., `https://abc123.ngrok-free.app`).

4. In the DoorDash Developer Portal, configure your webhook endpoint:
   - Go to the Developer Portal
   - Navigate to your application's settings
   - Set the webhook URL to `https://abc123.ngrok-free.app/webhooks/doordash`

## Step 4: Run the Test Script

Run the DoorDash test script to create a delivery in the simulator:

```bash
npm run test:doordash
```

This script will:
1. Generate unique IDs for the delivery quote and delivery
2. Create a delivery quote
3. Create a delivery with the simulation address
4. Check the delivery status
5. Print instructions for using the DoorDash simulator

## Step 5: Use the DoorDash Simulator

After your test script has run successfully:

1. **Go to the DoorDash Developer Portal**
   - Log in at https://developer.doordash.com/

2. **Navigate to the Simulator**
   - Click on "Simulator" in the left sidebar

3. **Find Your Delivery**
   - Look for your delivery using the External Delivery ID that was printed by the test script
   - Example: `delivery-1746395922571-881bd636`

4. **Advance the Delivery Status**
   - Click the "Advance to Next Step" button to move the delivery through different stages:
     1. Delivery Created
     2. Dasher Assigned
     3. Arrived at Pickup Location
     4. Picked Up
     5. Arrived at Dropoff
     6. Delivered

5. **Watch for Webhook Events**
   - If you set up webhook handling, you should see events in your server logs as the delivery progresses

## Step 6: Test Different Simulation Scenarios

DoorDash provides special addresses that trigger different delivery scenarios:

| Address | Simulation Behavior |
|---------|---------------------|
| 901 Market Street, San Francisco, CA 94103 | Standard successful delivery |
| 555 Market Street, San Francisco, CA 94103 | Delivery that will be returned |
| 1 Market Street, San Francisco, CA 94103 | Delivery that will be canceled |
| 720 Market Street, San Francisco, CA 94103 | No available Dashers (delivery creation fails) |

To test these scenarios:

1. Edit the `simulationAddress` variable in the test script
2. Run the test script again: `npm run test:doordash`
3. Check the responses and use the simulator to advance the delivery

## Step 7: Test Deliveries with Tips

DoorDash allows you to include tips with your delivery requests, which affects the overall delivery cost.

To test deliveries with tips:

1. The test script already includes a $5.99 tip (599 cents) by default
2. You can modify the tip amount by changing the `tip` property in the delivery request:
   ```typescript
   tip: 599 // $5.99 tip in cents - must be specified in the lowest currency denomination
   ```
3. Important notes about tips:
   - Tips must be specified in cents (or the equivalent lowest currency denomination)
   - 100% of the tip amount is passed to the Dasher
   - Tips may affect delivery fees and dasher assignment in production
   - In the sandbox environment, tips won't change the actual delivery behavior
   - In production, you will need to review your tip flow with DoorDash before going live

4. After including tips in your test deliveries, check the following:
   - Verify the tip amount appears in the delivery response
   - Check if the total fee includes the tip amount (fee + tip)
   - When using the simulator, advance the delivery and check if the tip is retained

## Step 8: Test Cancellation

To test canceling a delivery:

1. Create a delivery as described in Step 4
2. Uncomment the cancellation code in the test script or create a new script to cancel the delivery
3. Run the script with the external delivery ID from step 1

## Step 9: Monitor Webhook Events

If you've set up webhook handling:

1. Create a delivery as in Step 4
2. Use the simulator to advance the delivery status
3. Watch your server logs for incoming webhook events
4. Verify that your code correctly processes each event type

## Troubleshooting

### Duplicate Delivery ID Error

If you encounter a "Duplicate delivery ID" error:
- The test script should automatically generate unique IDs
- If issues persist, try manually modifying the ID prefix or format in the script

### Webhook Events Not Appearing

If webhook events aren't showing up:
- Verify your ngrok tunnel is running
- Check that your webhook URL is correctly configured in the Developer Portal
- Make sure your server is properly handling POST requests to the webhook endpoint
- Look for any error logs in your server console

### API Errors

For API errors:
- Check the error response details printed by the test script
- Verify your API credentials in the `.env` file
- Make sure you're using the correct sandbox environment

## Additional Resources

- [DoorDash Drive API Documentation](https://developer.doordash.com/en-US/docs/drive/reference/api/)
- [DoorDash SDK README](./README.md)
- [Sample Test Script](../../../scripts/test-doordash-sdk.ts) 