# Courier Optimizer

A lightweight backend service that helps restaurants reduce delivery costs by automatically choosing the cheaper courier between DoorDash Drive and Uber Direct for each order placed on their direct website.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Overview

Courier Optimizer acts as a middleware layer between your restaurant's ordering system and third-party delivery services. It automatically obtains quotes from multiple delivery providers, selects the most cost-effective option, and manages the entire delivery process through a unified API.

## Key Features

- **Cost Optimization**: Automatically compares delivery quotes from DoorDash Drive and Uber Direct
- **Smart Dispatch**: Routes orders to the most cost-effective courier in real-time
- **Status Tracking**: Unified webhook system for delivery status updates
- **API Abstraction**: Single API for multiple delivery services
- **Performance Analytics**: Tracks savings and delivery performance metrics
- **Failover Support**: Automatic fallback if primary courier is unavailable

## Technology Stack

- **Backend**: TypeScript/Node.js with Express
- **Database**: Supabase (PostgreSQL)
- **Testing**: Vitest + Mock Service Worker (MSW)
- **Deployment**: Optimized for Vercel

## Prerequisites

Before setting up this project, you will need:

1. **DoorDash Drive API Access**:
   - Developer account at [DoorDash Developer Portal](https://developer.doordash.com/portal/)
   - API key, Developer ID, and Key ID from DoorDash Developer Dashboard
   - Signing Secret for webhook verification

2. **Uber Direct API Access**:
   - Developer account at [Uber Developer Dashboard](https://developer.uber.com/)
   - Client ID and Client Secret
   - Customer ID for Direct fulfillment
   - API access with "eats.deliveries" scope

3. **Supabase Account**:
   - Project URL and API keys from [Supabase Dashboard](https://supabase.com/)

## Installation and Setup

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/courier-optimizer.git
cd courier-optimizer
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```
# DoorDash API credentials
DD_API_KEY=your_doordash_api_key
DD_DEVELOPER_ID=your_developer_id
DD_KEY_ID=your_key_id
DD_SIGNING_SECRET=your_signing_secret

# Uber API credentials
UBER_CLIENT_ID=your_uber_client_id
UBER_CLIENT_SECRET=your_uber_client_secret
UBER_CUSTOMER_ID=your_uber_customer_id

# Supabase credentials
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret

# General settings
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
```

4. **Verify your credentials**

```bash
# Check DoorDash credentials
npm run check:credentials

# Check Uber credentials
npm run check:uber:credentials
```

5. **Run the development server**

```bash
npm run dev
```

## DoorDash Drive Integration Guide

### Getting Started with DoorDash

1. **Obtain API Credentials**:
   - Create an account at [DoorDash Developer Portal](https://developer.doordash.com/portal/)
   - Create a new application in the Developer Dashboard
   - Generate API credentials (API Key, Developer ID, Key ID)
   - Store these in your `.env` file

2. **Configure Webhook URL** (for production):
   - In the DoorDash Developer Dashboard, set up webhook URL:
     `https://{your-domain}/webhooks/doordash`
   - Use the signing secret provided by DoorDash for webhook verification

3. **Test DoorDash Integration**:

```bash
# Run the DoorDash integration test
npm run test:doordash

# Test webhook handling (simulates delivery updates)
npm run test:doordash-webhook
```

### Using the DoorDash Client

The DoorDash client provides methods for creating deliveries, checking status, and handling webhooks:

```typescript
import * as doordashClient from './src/clients/doordash';

// Create a delivery quote
const quote = await doordashClient.getQuote({
  pickup_address: '123 Restaurant St, City, State, 12345',
  dropoff_address: '456 Customer Ave, City, State, 12345',
  // Additional parameters
});

// Create a delivery
const delivery = await doordashClient.createDelivery({
  external_delivery_id: 'your-order-123',
  pickup_address: '123 Restaurant St, City, State, 12345',
  pickup_phone_number: '+15551234567',
  dropoff_address: '456 Customer Ave, City, State, 12345',
  dropoff_phone_number: '+15559876543',
  // Additional parameters
});

// Check delivery status
const status = await doordashClient.getDeliveryStatus('delivery-id');
```

## Uber Direct Integration Guide

### Getting Started with Uber Direct

1. **Obtain API Credentials**:
   - Create an account at [Uber Developer Dashboard](https://developer.uber.com/)
   - Create a new application with "Direct" scope
   - Generate OAuth credentials (Client ID, Client Secret)
   - Obtain your Customer ID from the Uber Direct Dashboard
   - Store these in your `.env` file

2. **Configure OAuth Scopes**:
   - Ensure your application has the `eats.deliveries` scope

3. **Configure Webhook URL** (for production):
   - In the Uber Developer Dashboard, set up webhook URL:
     `https://{your-domain}/webhooks/uber`
   - Configure webhook events for delivery status updates

4. **Test Uber Integration**:

```bash
# Run the Uber integration test
npm run test:uber
```

### Using the Uber Client

The Uber client provides methods for authentication, creating deliveries, and checking status:

```typescript
import * as uberClient from './src/clients/uber';

// Get an authentication token
const token = await uberClient.getAuthToken();

// Create a delivery quote
const quote = await uberClient.getQuote({
  pickup_address: JSON.stringify({
    street_address: ["123 Restaurant St"],
    city: "City",
    state: "State",
    zip_code: "12345",
    country: "US"
  }),
  dropoff_address: JSON.stringify({
    street_address: ["456 Customer Ave"],
    city: "City",
    state: "State",
    zip_code: "12345",
    country: "US"
  }),
  // Additional parameters
});

// Create a delivery
const delivery = await uberClient.createDelivery({
  quote_id: quote.id,
  pickup_address: JSON.stringify({
    street_address: ["123 Restaurant St"],
    city: "City",
    state: "State",
    zip_code: "12345",
    country: "US"
  }),
  pickup_name: "Restaurant Name",
  pickup_phone_number: "+15551234567",
  dropoff_address: JSON.stringify({
    street_address: ["456 Customer Ave"],
    city: "City",
    state: "State",
    zip_code: "12345",
    country: "US"
  }),
  dropoff_name: "Customer Name",
  dropoff_phone_number: "+15559876543",
  // Additional parameters including manifest_items
});

// Check delivery status
const status = await uberClient.getDeliveryStatus(delivery.id);
```

## Using the Unified Client API

For simplicity, you can use the unified delivery client that automatically selects the optimal courier:

```typescript
import { unifiedClient } from './src/clients/unified';

// Get delivery quotes from multiple providers
const quotes = await unifiedClient.getQuotes({
  pickup_address: '123 Restaurant St, City, State, 12345',
  dropoff_address: '456 Customer Ave, City, State, 12345',
  items: [
    { name: 'Burger', quantity: 2 }
  ]
});

// Create delivery with the optimal provider
const delivery = await unifiedClient.createDelivery({
  order_id: 'your-order-123',
  pickup_address: '123 Restaurant St, City, State, 12345',
  pickup_name: 'Restaurant Name',
  pickup_phone_number: '+15551234567',
  dropoff_address: '456 Customer Ave, City, State, 12345',
  dropoff_name: 'Customer Name',
  dropoff_phone_number: '+15559876543',
  items: [
    { name: 'Burger', quantity: 2 }
  ]
});

// Get delivery status
const status = await unifiedClient.getDeliveryStatus(delivery.provider, delivery.id);
```

## Webhook Handling

The service handles delivery status updates via webhooks:

- DoorDash webhooks: `/webhooks/doordash`
- Uber webhooks: `/webhooks/uber`

Webhook payloads are processed, verified, and stored in the database, with status updates accessible via the API.

## API Endpoints

The service exposes the following REST API endpoints:

- `POST /api/delivery/quote` - Get delivery quotes from all providers
- `POST /api/delivery/create` - Create a delivery with the optimal provider
- `GET /api/delivery/:id` - Get delivery status
- `GET /api/delivery/:id/track` - Get delivery tracking URL
- `POST /api/webhooks/doordash` - DoorDash webhook endpoint
- `POST /api/webhooks/uber` - Uber webhook endpoint

## Testing

Comprehensive testing suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Test specific integrations
npm run test:doordash
npm run test:uber
npm run test:restaurant
npm run test:unified-client
```

## Error Handling and Debugging

For error troubleshooting:

- Check API credentials with the credential check scripts
- Verify webhook URLs are correctly configured
- Examine server logs for API request/response details
- For DoorDash auth issues, run the auth fix script: `npm run fix:auth`

## Deployment

The project is optimized for deployment on Vercel:

```bash
vercel
```

Required environment variables must be configured in your Vercel project settings.

## Project Structure

- `src/clients/` - API client libraries for DoorDash and Uber
- `src/routes/` - Express route handlers
- `src/webhooks/` - Webhook handlers for delivery status updates
- `src/db/` - Supabase database integration
- `src/utils/` - Utility functions
- `src/types/` - TypeScript type definitions
- `src/middleware/` - Express middleware
- `src/scripts/` - Utility scripts for testing and credential verification

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue on the repository or contact the maintainers. 