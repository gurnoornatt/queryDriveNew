# DoorDash Drive SDK Integration

This module provides a wrapper around the official DoorDash Drive SDK for delivery services.

## Setup

### 1. Environment Variables

The following environment variables are required:

```
DD_DEVELOPER_ID=your_doordash_developer_id
DD_KEY_ID=your_doordash_key_id
DD_SIGNING_SECRET=your_doordash_signing_secret
```

You can find these credentials in your DoorDash Developer Portal after creating an application.

### 2. Installation

The `@doordash/sdk` package is already installed as a dependency.

## Usage

### Import the Client

```typescript
import { doorDashSDK } from '../services/doordash-sdk/client';
```

Or through the index:

```typescript
import { doorDashSDK } from '../services/doordash-sdk';
```

### Adding Tips to Deliveries

DoorDash allows you to include tips with your deliveries, which get passed directly to the Dasher. To add a tip to a delivery:

```typescript
const deliveryResponse = await doorDashSDK.createDelivery({
  external_delivery_id: 'your-unique-id',
  pickup_address: '123 Main St, City, State, ZIP, Country',
  dropoff_address: '456 Other St, City, State, ZIP, Country',
  pickup_phone_number: '+15551234567',
  pickup_business_name: 'Your Restaurant',
  dropoff_phone_number: '+15559876543',
  dropoff_business_name: 'Customer Name',
  order_value: 1500, // Value in cents
  items: [
    { name: 'Item 1', quantity: 1, description: 'Item description' }
  ],
  tip: 599, // $5.99 tip in cents
  pickup_instructions: 'Ask for manager',
  dropoff_instructions: 'Leave at door'
});
```

Important notes about tips:
- Tips must be specified in cents (or the equivalent lowest currency denomination)
- 100% of the tip amount is passed to the Dasher
- For production usage, you'll need to review your tip implementation with DoorDash before going live
- Tips may affect delivery fees and dasher assignment in production

### Available Methods

The client exposes the following methods for interacting with the DoorDash Drive API:

1. **Get a Delivery Quote**
   ```typescript
   const quoteResponse = await doorDashSDK.getDeliveryQuote({
     external_delivery_id: 'your-unique-id',
     pickup_address: '123 Main St, City, State, ZIP, Country',
     dropoff_address: '456 Other St, City, State, ZIP, Country',
     pickup_phone_number: '+15551234567',
     pickup_business_name: 'Your Restaurant',
     dropoff_phone_number: '+15559876543',
     dropoff_business_name: 'Customer Name',
     // Optional fields
     pickup_instructions: 'Ask for manager',
     dropoff_instructions: 'Leave at door'
   });
   ```

2. **Create a Delivery**
   ```typescript
   const deliveryResponse = await doorDashSDK.createDelivery({
     external_delivery_id: 'your-unique-id',
     pickup_address: '123 Main St, City, State, ZIP, Country',
     dropoff_address: '456 Other St, City, State, ZIP, Country',
     pickup_phone_number: '+15551234567',
     pickup_business_name: 'Your Restaurant',
     dropoff_phone_number: '+15559876543',
     dropoff_business_name: 'Customer Name',
     order_value: 1500, // Value in cents
     items: [
       { name: 'Item 1', quantity: 1, description: 'Item description' }
     ],
     // Optional fields
     pickup_instructions: 'Ask for manager',
     dropoff_instructions: 'Leave at door'
   });
   ```

3. **Get Delivery Status**
   ```typescript
   const statusResponse = await doorDashSDK.getDeliveryStatus('your-external-delivery-id');
   ```

4. **Cancel a Delivery**
   ```typescript
   const cancelResponse = await doorDashSDK.cancelDelivery('your-external-delivery-id');
   ```

5. **Update a Delivery**
   ```typescript
   const updateResponse = await doorDashSDK.updateDelivery('your-external-delivery-id', {
     dropoff_instructions: 'New instructions'
   });
   ```

## Testing with DoorDash Simulator

DoorDash provides a simulator environment for testing your integration without creating actual deliveries.

### Running the Test Script

1. Make sure your environment variables are set up correctly.
2. Run the test script with:
   ```
   npx ts-node src/scripts/test-doordash-sdk.ts
   ```

This script will:
- Generate a unique ID for the test delivery
- Request a delivery quote
- Create a delivery
- Check the delivery status
- Optionally cancel the delivery (commented out by default)

### DoorDash Simulation Addresses

The DoorDash simulator recognizes specific addresses that trigger different behaviors:

| Address | Simulation Behavior |
|---------|---------------------|
| 901 Market Street, San Francisco, CA 94103 | Standard successful delivery |
| 555 Market Street, San Francisco, CA 94103 | Delivery that will be returned |
| 1 Market Street, San Francisco, CA 94103 | Delivery that will be canceled |
| 720 Market Street, San Francisco, CA 94103 | No available Dashers (delivery creation fails) |

For a full list of test scenarios, refer to the [DoorDash Drive documentation](https://docs.doordash.com/en/developer/drive/#testing).

### Simulating Webhook Events

To test webhook handling:

1. Start your server locally
2. Use a tool like ngrok to expose your local webhook endpoint: `ngrok http 3000`
3. Use the ngrok URL in your test script for the webhook URL parameter
4. The DoorDash simulator will send webhook events as the delivery progresses

## Error Handling

All methods throw errors for API failures. Always wrap API calls in try/catch blocks:

```typescript
try {
  const response = await doorDashSDK.getDeliveryQuote(data);
  // Handle success
} catch (error) {
  // Handle error
  console.error('API Error:', error);
  if (error.response) {
    console.error('Response data:', error.response.data);
    console.error('Status code:', error.response.status);
  }
}
```

## API Response Structure

All API responses are wrapped in a `DoorDashResponse` object with the following structure:

```typescript
{
  data: {
    // Response data specific to the API call
  },
  headers: {
    // HTTP headers from the response
  },
  status: 200 // HTTP status code
}
```

Access the actual response data via the `data` property.

## Webhooks

DoorDash provides webhook notifications for delivery status updates. To handle these webhooks:

1. Create a webhook endpoint that accepts POST requests (already set up at `/webhooks/doordash`)
2. Test the webhook endpoint using:
   ```
   npm run test:doordash-webhook -- https://your-ngrok-url
   ```
3. View detailed webhook documentation in the [Webhook Guide](./WEBHOOK_GUIDE.md)

## Testing

For detailed testing instructions and troubleshooting, see:
- [Testing Guide](./TESTING_GUIDE.md) - For comprehensive end-to-end testing
- [Webhook Guide](./WEBHOOK_GUIDE.md) - For webhook specific testing and integration 