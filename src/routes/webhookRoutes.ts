import { Express, Request, Response, NextFunction } from 'express';
import { verifyWebhookSignature } from '../utils/doorDashAuth';

/**
 * Setup routes for webhook handlers
 */
export const setupWebhookRoutes = (app: Express) => {
  /**
   * @route GET /webhooks/doordash
   * @description Returns a friendly message for browser access to the webhook endpoint
   */
  app.get('/webhooks/doordash', (req: Request, res: Response) => {
    res.status(200).json({
      message: 'DoorDash webhook endpoint is active. POST requests with valid DoorDash signatures will be processed.',
      help: 'This endpoint is meant to receive webhook POST events from DoorDash Drive API.',
      test_command: 'To test with curl: curl -X POST -H "Content-Type: application/json" -H "X-DoorDash-Signature: test-signature" -H "X-DoorDash-Timestamp: 1234567890" -d \'{"event_type":"test", "delivery_id":"test-id", "external_delivery_id":"test-ext-id"}\' https://[your-ngrok-url]/webhooks/doordash',
    });
  });

  /**
   * @route POST /webhooks/doordash
   * @description Handle DoorDash delivery status updates
   */
  app.post('/webhooks/doordash', handleDoorDashWebhook);

  /**
   * @route POST /webhooks/uber
   * @description Handle Uber delivery status updates
   */
  app.post('/webhooks/uber', (req: Request, res: Response) => {
    // This will be implemented in Phase 2
    res.status(501).json({ message: 'Not implemented yet' });
  });

  /**
   * @route GET /webhooks/uber
   * @description Returns a friendly message for browser access to the webhook endpoint
   */
  app.get('/webhooks/uber', (req: Request, res: Response) => {
    res.status(200).json({
      message: 'Uber webhook endpoint is active, but not yet implemented.',
      help: 'This endpoint will be implemented in Phase 2.',
    });
  });
};

/**
 * Process DoorDash webhook delivery status updates
 */
export const handleDoorDashWebhook = (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Received DoorDash webhook request:', {
      headers: {
        signature: req.header('X-DoorDash-Signature') ? 'Present' : 'Missing',
        timestamp: req.header('X-DoorDash-Timestamp') ? 'Present' : 'Missing'
      },
      body: JSON.stringify(req.body)
    });

    // Get required headers for verification
    const signature = req.header('X-DoorDash-Signature');
    const timestamp = req.header('X-DoorDash-Timestamp');
    const body = JSON.stringify(req.body);

    // Return 401 if headers are missing
    if (!signature || !timestamp) {
      console.warn('DoorDash webhook missing required headers:', { signature, timestamp });
      return res.status(401).json({
        error: 'Missing required DoorDash webhook headers',
      });
    }

    // Verify the webhook signature
    const isValid = verifyWebhookSignature(signature, timestamp, body);
    if (!isValid) {
      console.warn('DoorDash webhook has invalid signature');
      return res.status(401).json({
        error: 'Invalid webhook signature',
      });
    }

    // Process the webhook payload
    const payload = req.body;
    
    console.info(
      `Processed DoorDash webhook: ${payload.event_type} for delivery ${payload.delivery_id || 'unknown'}`
    );

    // TODO: In Phase 3, update delivery status in the database

    // Respond with success
    return res.status(200).json({
      message: 'Webhook processed successfully',
      received_at: new Date().toISOString(),
      event_type: payload.event_type || 'unknown'
    });
  } catch (error) {
    console.error('Error processing DoorDash webhook:', error);
    next(error);
  }
};
