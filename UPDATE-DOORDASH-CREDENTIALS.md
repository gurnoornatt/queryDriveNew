# How to Update Your DoorDash API Credentials

## Overview

This guide explains why you're experiencing different authentication behavior with different DoorDash API test scripts.

When you see the error message:
```
UserAuth token has expired or the request contains an invalid UserAuth token
```

It means your DoorDash API credentials need to be regenerated.

## Key Findings

After extensive testing, we've discovered:

1. **The Basic SDK Test Works**: The `npm run test:doordash` command works even with the current credentials because it's using the official DoorDash SDK for basic delivery endpoints.

2. **The Restaurant API Test Fails**: The `npm run test:restaurant` command fails with "UserAuth token has expired" because it uses a custom authentication implementation.

3. **Both Are Using the Same Credentials**: Both tests use the same `.env` variables, but the SDK has special handling for authentication that works differently.

## Steps to Fix Authentication Issues

### 1. Generate New API Keys

1. Go to the [DoorDash Developer Portal](https://developer.doordash.com/portal/)
2. Log in with your DoorDash developer account
3. Navigate to "Applications" in the left sidebar
4. Select your application
5. Click "Generate New API Key"
6. Save the newly generated credentials:
   - Developer ID
   - Key ID
   - Signing Secret

### 2. Update Your Environment Variables

1. Open your project's `.env` file
2. Update the following variables with your new credentials:
   ```
   DD_DEVELOPER_ID=your_new_developer_id
   DD_KEY_ID=your_new_key_id
   DD_SIGNING_SECRET=your_new_signing_secret
   ```
3. Save the `.env` file

### 3. Run the Authentication Fix Script

This script will:
- Clean up dependencies
- Ensure you're using a compatible DoorDash SDK version
- Rebuild the project
- Test the authentication

```bash
npm run fix:auth
```

### 4. Test Your Authentication

Run tests in the following order:

1. First verify the SDK authentication works:
   ```bash
   npm run test:doordash
   ```

2. Then test the direct API:
   ```bash
   npm run test:direct-api
   ```

3. Finally, test the Restaurant API:
   ```bash
   npm run test:restaurant
   ```

## Understanding Why This Happens

The DoorDash API uses JWT (JSON Web Token) authentication, but the exact format and requirements vary between:

1. **The SDK implementation**: Has special internal handling of authentication tokens
2. **The Restaurant API**: Has stricter JWT validation that requires specific fields in the payload

When you regenerate credentials, both will work properly with fresh keys.

## If You Continue to Have Problems

If you regenerate credentials and the SDK tests work but Restaurant API tests still fail:

1. Use the SDK-based test script we've created:
   ```bash
   npm run test:restaurant-sdk-client
   ```

2. This uses the SDK authentication mechanism that's proven to be more reliable

## Additional Resources

- [DoorDash API Documentation](https://developer.doordash.com/docs/api/)
- [Authentication Troubleshooting](AUTHENTICATION-FIX.md)

If you continue to have issues after updating your credentials, contact DoorDash Developer Support. 