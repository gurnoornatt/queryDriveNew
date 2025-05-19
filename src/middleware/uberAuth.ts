import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Middleware to validate Uber webhook requests
 * @param req Express request
 * @param res Express response
 * @param next Next function
 */
export const validateUberWebhook = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  try {
    const signature = req.headers['x-uber-signature'];
    const clientSecret = process.env.UBER_CLIENT_SECRET;
    
    // Check if we're in development mode and should bypass verification
    const isDevelopmentMode = process.env.NODE_ENV === 'development' && process.env.BYPASS_WEBHOOK_VERIFICATION === 'true';
    
    // If in development mode and bypass is enabled, skip verification
    if (isDevelopmentMode) {
      console.log('[Uber Webhook] Development mode - bypassing signature verification');
      next();
      return;
    }

    // Verify that the client secret is configured
    if (!clientSecret) {
      console.error('[Uber Webhook] Missing UBER_CLIENT_SECRET environment variable');
      res.status(500).json({ 
        success: false, 
        message: 'Server configuration error: Missing webhook secret'
      });
      return;
    }

    // Verify that the signature is present
    if (!signature) {
      console.error('[Uber Webhook] Missing x-uber-signature header');
      res.status(401).json({ 
        success: false, 
        message: 'Missing signature header'
      });
      return;
    }

    // Verify the signature
    const computedSignature = crypto
      .createHmac('sha256', clientSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');
    
    if (signature !== computedSignature) {
      console.error('[Uber Webhook] Invalid signature');
      console.debug(`[Uber Webhook] Expected: ${computedSignature}, Received: ${signature}`);
      res.status(401).json({ 
        success: false, 
        message: 'Invalid signature'
      });
      return;
    }

    // Signature is valid, continue
    next();
  } catch (error) {
    console.error('[Uber Webhook] Authentication error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Authentication error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 