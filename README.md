# Courier Optimizer

A lightweight backend service that helps restaurants reduce delivery costs by automatically choosing the cheaper courier between DoorDash Drive and Uber Direct for each order placed on their direct website.

## Features

- Automatically compares delivery quotes from DoorDash Drive and Uber Direct
- Dispatches to the cheaper option
- Tracks delivery status via webhooks
- Generates reports on savings and delivery performance

## Technology Stack

- Backend: TypeScript/Node.js with Express
- Database: Supabase (Postgres)
- Testing: Vitest + Mock Service Worker (MSW)
- Deployment: Vercel

## Development Setup

1. **Clone the repository**

```bash
git clone <repository-url>
cd courier-optimizer
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:
- DoorDash API credentials
- Uber API credentials
- Supabase credentials

4. **Run the development server**

```bash
npm run dev
```

## Testing

Run tests:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

Coverage report:

```bash
npm run test:coverage
```

## Deployment

The project is set up for deployment on Vercel.

```bash
vercel
```

## Project Structure

- `src/clients/` - API client libraries for DoorDash and Uber
- `src/routes/` - Express route handlers
- `src/webhooks/` - Webhook handlers for delivery status updates
- `src/db/` - Database integration
- `src/utils/` - Utility functions
- `src/types/` - TypeScript type definitions
- `src/middleware/` - Express middleware
- `src/tests/` - Test files

## Phased Development

- Phase 1: DoorDash Drive Integration
- Phase 2: Uber Direct Integration
- Phase 3: Build the Courier Optimizer API

## Manual Setup Requirements

1. DoorDash Drive production & sandbox API keys (must be manually obtained)
2. Uber Direct "Direct Fulfillment" API scope request (must be manually requested)
3. Webhook URL configuration in both provider dashboards
4. Domain DNS setup (e.g., api.mydomain.com) for Vercel 