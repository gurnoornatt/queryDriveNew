/**
 * DoorDash Webhook Authentication Middleware
 * 
 * This middleware validates that incoming requests to the DoorDash webhook endpoint
 * have the proper Basic Authentication credentials.
 */

import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Basic Authentication credentials for DoorDash webhooks
 * In production, these should be loaded from environment variables
 */
const DD_WEBHOOK_USERNAME = ''; // Username isn't used by DoorDash for Basic Auth (empty string)
const DD_WEBHOOK_PASSWORD = process.env.DD_WEBHOOK_PASSWORD || '#H1k2g3e4n5f6f6f6'; // Fallback to hardcoded for dev

/**
 * Extract the Base64 encoded credentials from Authorization header
 * @param authHeader - The Authorization header string
 * @returns Decoded username and password, or null if invalid format
 */
function extractCredentials(authHeader: string): { username: string; password: string } | null {
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return null;
  }

  try {
    // Extract the Base64 encoded credentials
    const base64Credentials = authHeader.split(' ')[1];
    // Decode the Base64 string
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    
    // Split into username and password (format: "username:password")
    const [username, password] = credentials.split(':');
    
    return { username, password };
  } catch (error) {
    console.error('Error decoding Basic Auth credentials:', error);
    return null;
  }
}

/**
 * Middleware to validate DoorDash webhook requests
 */
export function validateDoorDashWebhook(req: Request, res: Response, next: NextFunction): void {
  try {
    // Get the Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.warn('Missing Authorization header in DoorDash webhook request');
      res.status(401).json({ error: 'Unauthorized: Missing credentials' });
      return;
    }

    // Extract credentials
    const credentials = extractCredentials(authHeader);
    
    if (!credentials) {
      console.warn('Invalid Authorization format in DoorDash webhook request');
      res.status(401).json({ error: 'Unauthorized: Invalid credential format' });
      return;
    }

    // For DoorDash's Basic Auth, we only check the password
    // (they might not use a username field at all)
    if (credentials.password !== DD_WEBHOOK_PASSWORD) {
      console.warn('Invalid password in DoorDash webhook request');
      res.status(401).json({ error: 'Unauthorized: Invalid credentials' });
      return;
    }

    // Authentication successful, proceed to the route handler
    next();
  } catch (error) {
    console.error('Error in DoorDash webhook authentication:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
} 