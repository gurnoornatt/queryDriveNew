# Webhook System

This directory contains the implementation of the webhook system for the Courier Optimizer application. The webhook system handles incoming webhook events from delivery providers (currently DoorDash and Uber) and processes them into a standardized format.

## Components

- **WebhookStorage**: Stores and manages webhook records.
- **WebhookQueue**: Manages the processing queue for incoming webhooks, including retries for failed processing attempts.
- **WebhookProcessorFactory**: Factory for creating webhook processors based on the provider.
- **DoorDashWebhookProcessor**: Processes webhooks from DoorDash.
- **UberWebhookProcessor**: Processes webhooks from Uber.

## Authentication

Each provider requires different authentication methods for verifying webhooks:

### DoorDash

DoorDash uses Basic Authentication. The webhook authentication middleware is implemented in `src/middleware/doordashAuth.ts`.

### Uber

Uber uses HMAC signature verification with SHA-256. The webhook authentication middleware is implemented in `src/middleware/uberAuth.ts`.

## Development Mode

For development and testing, the authentication verification can be bypassed by setting the following environment variables:

```
NODE_ENV=development
BYPASS_WEBHOOK_VERIFICATION=true
```

This allows testing webhooks locally without needing to compute valid signatures.

## Webhook Event Types

The system standardizes various webhook event types:

- `DELIVERY_CREATED`: When a new delivery is created
- `DELIVERY_STATUS_CHANGED`: When a delivery's status changes
- `DELIVERY_PICKUP`: When a delivery is picked up by a courier
- `DELIVERY_COMPLETED`: When a delivery is completed
- `DELIVERY_CANCELLED`: When a delivery is cancelled
- `COURIER_LOCATION_UPDATED`: When a courier's location is updated

## Webhook Status Types

Standardized delivery statuses:

- `PENDING`: Initial state, waiting for courier
- `ASSIGNED`: Courier assigned to the delivery
- `PICKUP`: Courier has picked up the delivery
- `IN_TRANSIT`: Delivery is in transit to destination
- `DELIVERED`: Delivery was successfully completed
- `FAILED`: Delivery failed for some reason
- `CANCELLED`: Delivery was cancelled
- `RETURNED`: Delivery was returned to sender

## Tracking URLs

For both DoorDash and Uber, the system extracts tracking URLs when available from webhook payloads. These URLs can be used to track the delivery's status and location.

## Implementation Notes

1. **Idempotency**: The webhook system is designed to handle duplicate webhook events safely. Each webhook is stored with a unique ID and processed only once.

2. **Retries**: Failed webhook processing attempts are retried with an exponential backoff strategy.

3. **Error Handling**: Errors during webhook processing are logged and the webhook is marked as failed after the maximum number of retry attempts.

4. **Development Mode**: The system includes a development mode that bypasses signature verification for easier testing. 