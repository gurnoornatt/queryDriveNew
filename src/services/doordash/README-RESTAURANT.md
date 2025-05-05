# DoorDash Drive Restaurant Integration

This guide explains how to integrate DoorDash Drive with your restaurant business, allowing you to create delivery requests directly from your restaurant locations.

## Overview

DoorDash Drive API provides functionality to manage restaurant businesses, store locations, and create deliveries directly from your stores. This integration allows restaurants to:

1. Register restaurant businesses with DoorDash
2. Create and manage store locations for each business
3. Create deliveries directly from store locations
4. Track deliveries and receive status updates via webhooks

## Getting Started

### Prerequisites

- DoorDash Developer Account
- API Credentials (`DD_DEVELOPER_ID`, `DD_KEY_ID`, and `DD_SIGNING_SECRET`) from the Developer Portal
- Environment variables set in your `.env` file

### Configuration

Ensure your `.env` file includes the following variables:

```
DD_DEVELOPER_ID=your_doordash_developer_id
DD_KEY_ID=your_doordash_key_id
DD_SIGNING_SECRET=your_doordash_signing_secret
```

## Business and Store Management

### Creating a Restaurant Business

```typescript
import * as doordashRestaurant from '../clients/doordashRestaurant';

// Create a business
const business = await doordashRestaurant.createBusiness({
  external_business_id: 'unique-business-id',
  name: 'Your Restaurant Name',
});
```

### Creating a Store Location

```typescript
import * as doordashRestaurant from '../clients/doordashRestaurant';

// Create a store for a business
const store = await doordashRestaurant.createStore({
  external_store_id: 'unique-store-id',
  external_business_id: 'business-id',
  name: 'Store Location Name',
  address: {
    street: '901 Market Street',
    city: 'San Francisco',
    state: 'CA',
    zip_code: '94103',
    country: 'US',
  },
  phone_number: '+14155550123',
  business_hours: [
    {
      day_of_week: 'monday',
      open_time: '09:00',
      close_time: '22:00',
    },
    // Add more days...
  ],
});
```

### Listing and Managing Businesses and Stores

```typescript
// Get a business
const business = await doordashRestaurant.getBusiness('business-id');

// Update a business
const updatedBusiness = await doordashRestaurant.updateBusiness({
  external_business_id: 'business-id',
  name: 'Updated Restaurant Name',
});

// List all businesses
const businesses = await doordashRestaurant.listBusinesses();

// Get a store
const store = await doordashRestaurant.getStore('business-id', 'store-id');

// Update a store
const updatedStore = await doordashRestaurant.updateStore({
  external_store_id: 'store-id',
  external_business_id: 'business-id',
  name: 'Updated Store Name',
  address: { /* address details */ },
  phone_number: '+14155550123',
});

// List stores for a business
const stores = await doordashRestaurant.listStores('business-id');
```

## Creating Deliveries from Stores

When you create a business and store in DoorDash, you can use those IDs to create deliveries directly from your stores:

```typescript
import * as doordashRestaurant from '../clients/doordashRestaurant';

// Create a delivery from a store
const delivery = await doordashRestaurant.createDeliveryFromStore({
  external_delivery_id: 'unique-delivery-id',
  pickup_external_business_id: 'business-id',
  pickup_external_store_id: 'store-id',
  dropoff_address: {
    street: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    zip_code: '94105',
    country: 'US',
    unit: '4B', // Optional
  },
  dropoff_business_name: 'Customer Name',
  dropoff_phone_number: '+14155551234',
  dropoff_instructions: 'Leave at the front desk',
  items: [
    {
      name: 'Cheeseburger',
      quantity: 2,
      description: 'Double cheeseburger with fries',
      price: 1295, // $12.95 in cents
    },
    {
      name: 'Chicken Sandwich',
      quantity: 1,
      description: 'Spicy chicken sandwich',
      price: 1095, // $10.95 in cents
    },
  ],
  order_value: 3685, // $36.85 in cents
  dropoff_contact_given_name: 'John',
  dropoff_contact_family_name: 'Doe',
  dropoff_contact_send_notifications: true,
  is_catering_order: false,
  contactless_dropoff: true,
});
```

### Benefits of Using Business and Store IDs

When you create a delivery with business and store IDs:
- The store's address and contact details are used automatically
- You don't have to provide pickup details in every delivery request
- DoorDash's address resolution system saves the correct address for your store
- Dashers can get to the right pickup location every time
- You can access future delivery capabilities that require business-level configuration

## API Endpoints

The following API endpoints are available for restaurant operations:

### Business Endpoints

- `POST /api/restaurants/doordash/businesses` - Create a business
- `GET /api/restaurants/doordash/businesses/:externalBusinessId` - Get a business
- `GET /api/restaurants/doordash/businesses` - List all businesses
- `PATCH /api/restaurants/doordash/businesses/:externalBusinessId` - Update a business

### Store Endpoints

- `POST /api/restaurants/doordash/stores` - Create a store
- `GET /api/restaurants/doordash/businesses/:externalBusinessId/stores/:externalStoreId` - Get a store
- `GET /api/restaurants/doordash/businesses/:externalBusinessId/stores` - List stores for a business
- `PATCH /api/restaurants/doordash/businesses/:externalBusinessId/stores/:externalStoreId` - Update a store

### Delivery Endpoint

- `POST /api/restaurants/doordash/deliveries` - Create a delivery from a store

## Testing

You can test the restaurant API functionality with the provided test script:

```bash
npm run test:restaurant
```

This will:
1. Create a test restaurant business
2. Create a store for the business
3. Get business and store details
4. Update the business and store
5. Create a delivery from the store
6. List businesses and stores
7. Output IDs that can be used to track the delivery in the DoorDash Developer Portal Simulator

## Webhook Integration

To receive real-time delivery status updates, you can configure a webhook endpoint in the DoorDash Developer Portal to point to:

```
https://your-domain.com/webhooks/doordash
```

This endpoint is already set up to receive and verify DoorDash webhook events. See the [DoorDash Webhook Guide](../doordash-sdk/WEBHOOK_GUIDE.md) for more details. 