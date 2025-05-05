# DoorDash Restaurant API Troubleshooting Guide

This guide helps you troubleshoot common issues with the DoorDash Restaurant API integration.

## Authentication Issues

If you're getting `401 Unauthorized` errors when trying to use the DoorDash Restaurant API, follow these steps:

### 1. Check Your Credentials

Ensure that your `.env` file contains the correct DoorDash credentials:

```
DD_DEVELOPER_ID=your_doordash_developer_id
DD_KEY_ID=your_doordash_key_id
DD_SIGNING_SECRET=your_doordash_signing_secret
```

You can verify your credentials are correctly loaded by running:

```bash
npm run check:credentials
```

### 2. Verify Token Validity

DoorDash API keys can expire. Log into your [DoorDash Developer Portal](https://developer.doordash.com/portal/) to verify:

- Your API key is still active
- Your account has access to the Restaurant API endpoints
- You haven't exceeded your API rate limits

### 3. Check Authentication Headers

The DoorDash API requires specific authentication headers. Run the Perplexity-powered checker to get AI-assisted troubleshooting:

```bash
npm run check:auth:perplexity
```

This tool requires a Perplexity API key in your `.env` file:

```
PERPLEXITY_API_KEY=your_perplexity_api_key
```

### 4. Common Authentication Issues

- **Expired Developer Token**: Tokens typically last 1 year. Generate a new one in the Developer Portal.
- **Clock Sync Issues**: Ensure your server's clock is in sync, as timestamp validation is strict.
- **Missing Headers**: All required headers must be present and correctly formatted.
- **Account Permission Issues**: Your account might not have access to the Restaurant API.

## Port Conflicts

If you encounter a `EADDRINUSE: address already in use` error when starting the server:

### 1. Check for Processes Using the Port

Run:

```bash
npm run check:port
```

This will identify processes using port 3000 (or your configured port) and offer to kill them.

### 2. Start the Server Safely

Use:

```bash
npm run start:clean
```

This will automatically kill any processes on the port, check credentials, and start the server.

## Type Errors

If you encounter type errors in the DoorDash Restaurant API:

### 1. Ensure Your Code Matches DoorDash API Requirements

The DoorDash API expects specific object structures. Make sure your input objects match the required types.

### 2. Check for API Changes

DoorDash occasionally updates their API. Check the latest documentation to ensure you're using the correct types and fields.

### 3. Re-build the Project

Sometimes type errors can be resolved by rebuilding:

```bash
npm run build
```

## Testing the Restaurant API

To test the restaurant API integration:

```bash
npm run test:restaurant
```

This script will:
1. Create a test business
2. Create a test store
3. Create a test delivery
4. Verify the API is working correctly

If the test fails, check:
- Authentication issues (see above)
- Network connectivity
- API rate limits
- Input data format

## Debugging with Detailed Logs

To get more detailed logs, set the `LOG_LEVEL` environment variable to `debug` in your `.env` file:

```
LOG_LEVEL=debug
```

Then restart the server to see more detailed logs about API requests and responses.

## Need More Help?

If you've tried all the steps above and still have issues:

1. Check the [DoorDash API Documentation](https://developer.doordash.com/docs/api/)
2. Use the Perplexity AI-powered troubleshooter: `npm run check:auth:perplexity`
3. Look for error details in the response body and status codes
4. Contact DoorDash Developer Support for account-specific issues 