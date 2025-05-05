# DoorDash API Authentication Fix Guide

Based on our diagnostics and research, we've identified the core issue with the DoorDash Restaurant API integration, and here's how to fix it.

## Diagnosis Summary

The error message `UserAuth token has expired or the request contains an invalid UserAuth token` indicates an authentication issue with your DoorDash API credentials. Our tests confirmed:

1. Your environment variables are correctly set
2. The API calls are being made with proper header formats
3. However, the tokens being generated are not being accepted by the DoorDash API

## Root Causes & Solutions

### 1. Expired API Credentials

**Problem:** The primary issue is likely that your DoorDash API credentials have expired.

**Solution:** Log into the [DoorDash Developer Portal](https://developer.doordash.com/portal/) and regenerate new API credentials.

1. Navigate to the "Applications" section
2. Select your application
3. Click "Generate new credentials"
4. Update your `.env` file with the new values for:
   ```
   DD_DEVELOPER_ID=your_new_developer_id
   DD_KEY_ID=your_new_key_id
   DD_SIGNING_SECRET=your_new_signing_secret
   ```

### 2. SDK Version Issues

**Problem:** Some versions of the DoorDash SDK (particularly 0.6.x) have reported authentication issues.

**Solution:** Downgrade to a more stable version of the SDK:

```bash
npm uninstall @doordash/sdk
npm install @doordash/sdk@0.4.6
```

Then update your package.json to specify this version:

```json
"dependencies": {
  "@doordash/sdk": "0.4.6",
  // other dependencies...
}
```

### 3. JWT Token Configuration Issues

**Problem:** The JWT token generation might have incorrect configuration values for expiration times or issued-at times.

**Solution:** If downgrading doesn't work, modify the JWT token generation to ensure:

1. The `iat` (issued at) field uses current server time (in seconds)
2. The `exp` (expiration) field doesn't exceed 30 minutes (1800 seconds) from `iat`
3. Add a small buffer time to account for network latency (5-10 seconds)

## Step-by-Step Fix Process

1. **Check API key status**
   - Verify in the DoorDash Developer Portal if your API keys are still active
   - Regenerate new keys if necessary

2. **Update SDK version**
   - Downgrade to @doordash/sdk@0.4.6 as recommended
   - Run your tests again to see if this resolves the issue

3. **Check server time synchronization**
   - Ensure your server's clock is accurate
   - Use reliable NTP services if necessary

4. **Test with direct API**
   - After applying the fixes, run:
   ```bash
   npm run test:direct-api
   ```
   - This will help verify your authentication is working

5. **Test with Restaurant API**
   - After successful direct API authentication, run:
   ```bash
   npm run test:restaurant
   ```

## Additional Recommendations

1. **Enhanced Logging**
   - Add detailed logging of JWT token parameters for debugging
   - Log and track all authentication failures

2. **Token Management**
   - Implement token caching and auto-renewal before expiration
   - Add retry logic with exponential backoff for failed authentication attempts

3. **Regular Updates**
   - Check for DoorDash API documentation updates periodically
   - Review recommended SDK versions and update as needed

## Maintenance Best Practices

1. Set up monitoring for authentication failures
2. Implement alerts for expired or nearly-expired API credentials
3. Create a process for regularly updating API credentials every 6-9 months
4. Test API integrations in a staging environment before deploying to production

By following these steps, you should be able to resolve the authentication issues with the DoorDash Restaurant API. 