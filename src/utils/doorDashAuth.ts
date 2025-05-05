import crypto from 'crypto';
import { config } from 'dotenv';
import jwt from 'jsonwebtoken';

// Load environment variables
config();

// DoorDash Drive API credentials from environment variables
const DD_DEVELOPER_ID = process.env.DD_DEVELOPER_ID;
const DD_KEY_ID = process.env.DD_KEY_ID;
const DD_SIGNING_SECRET = process.env.DD_SIGNING_SECRET;

// DoorDash API base URL
export const DD_API_BASE_URL = 'https://openapi.doordash.com/drive/v2';

// Check if credentials are available
if (!DD_DEVELOPER_ID || !DD_KEY_ID || !DD_SIGNING_SECRET) {
  console.error(
    'Missing DoorDash API credentials. Make sure DD_DEVELOPER_ID, DD_KEY_ID, and DD_SIGNING_SECRET are set in the .env file.'
  );
}

/**
 * Generate HMAC signature for DoorDash API requests
 * 
 * @param httpMethod - HTTP method (GET, POST, etc.)
 * @param urlPath - Request URL path (without base URL)
 * @param requestBody - Request body as a JSON string (for POST/PUT requests)
 * @param timestamp - Unix timestamp in milliseconds
 * @returns The HMAC signature
 */
export const generateSignature = (
  httpMethod: string,
  urlPath: string,
  requestBody: string = '',
  timestamp: number = Date.now()
): string => {
  // Create string to sign
  const stringToSign = [
    httpMethod.toUpperCase(),
    urlPath,
    requestBody,
    timestamp.toString(),
  ].join('');

  // Create HMAC signature
  const signature = crypto
    .createHmac('sha256', DD_SIGNING_SECRET || '')
    .update(stringToSign)
    .digest('hex');

  return signature;
};

/**
 * Create a JWT token exactly matching how the DoorDash SDK does it
 * This is crucial for authentication to work with Restaurant API
 */
function createSDKCompatibleToken(): string {
  // Create JWT header - exactly matching SDK header format
  const header = {
    "alg": "HS256",
    "dd-ver": "DD-JWT-V1"
  };
  
  // Create JWT payload - exactly matching SDK payload format
  const payload = {
    "aud": "doordash", // This is crucial - the SDK adds this but our original implementation didn't
    "iss": DD_DEVELOPER_ID,
    "kid": DD_KEY_ID,
    "exp": Math.floor((Date.now() / 1000) + 60 * 5), // 5 minutes from now
    "iat": Math.floor(Date.now() / 1000),
  };
  
  // Sign the JWT using the SDK approach with base64 decoding of the signing secret
  return jwt.sign(
    payload, 
    Buffer.from(DD_SIGNING_SECRET || '', 'base64'), 
    {
      algorithm: 'HS256',
      header: header
    }
  );
}

/**
 * Get authentication headers for DoorDash API requests
 * Updated to use JWT tokens that exactly match the SDK
 * 
 * @param httpMethod - HTTP method (GET, POST, etc.)
 * @param urlPath - Request URL path (without base URL)
 * @param requestBody - Request body as a JSON string (for POST/PUT requests)\
 * @returns Headers object with authentication
 */
export const getAuthHeaders = (
  httpMethod: string,
  urlPath: string,
  requestBody: string = ''
): Record<string, string> => {
  // Generate the JWT token using our new SDK-compatible implementation
  const token = createSDKCompatibleToken();
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

/**
 * Verifies the signature of a DoorDash webhook
 * 
 * @param signature The signature from the X-DoorDash-Signature header
 * @param timestamp The timestamp from the X-DoorDash-Timestamp header
 * @param body The raw body of the webhook request
 * @returns boolean indicating if the signature is valid
 */
export function verifyWebhookSignature(
  signature: string,
  timestamp: string,
  body: string
): boolean {
  try {
    if (!DD_DEVELOPER_ID || !DD_SIGNING_SECRET) {
      console.error('Missing DoorDash credentials (DEVELOPER_ID or SIGNING_SECRET)');
      return false;
    }

    // Check if the timestamp is too old (protect against replay attacks)
    const requestTime = parseInt(timestamp, 10);
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Reject webhooks older than 5 minutes
    if (currentTime - requestTime > 300) {
      console.error('Webhook timestamp is too old');
      return false;
    }

    // Signature format is t=timestamp,v1=signature
    // Extract the v1 signature value
    const providedSignature = signature.split(',').find(s => s.startsWith('v1='))?.split('=')[1];
    
    if (!providedSignature) {
      console.error('Invalid signature format');
      return false;
    }

    // Construct the message to sign: timestamp + developer_id + request_body
    const message = `${timestamp}${DD_DEVELOPER_ID}${body}`;
    
    // Compute the HMAC signature
    const computedSignature = crypto
      .createHmac('sha256', DD_SIGNING_SECRET)
      .update(message)
      .digest('hex');
    
    // Compare signatures in constant time to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(providedSignature, 'hex'),
      Buffer.from(computedSignature, 'hex')
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
} 