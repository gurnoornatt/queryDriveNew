import express, { Request, Response } from 'express';
import { WebhookQueue } from '../webhooks/WebhookQueue';
import { WebhookStorage } from '../webhooks/WebhookStorage';
import { WebhookProvider } from '../webhooks/types';
import { validateDoorDashWebhook } from '../middleware/doordashAuth';
import { validateUberWebhook } from '../middleware/uberAuth';

/**
 * Set up webhook routes
 * @param app Express application
 */
export function setupWebhookRoutes(app: express.Express): void {
  const webhookQueue = WebhookQueue.getInstance();
  const webhookStorage = WebhookStorage.getInstance();

  // DoorDash webhook routes
  app.get('/webhooks/doordash', (req: Request, res: Response) => {
    res.status(200).json({
      message: 'DoorDash webhook endpoint is active. POST requests with valid DoorDash authentication will be processed.',
      help: 'This endpoint is meant to receive webhook POST events from DoorDash Drive API.',
      auth: 'This endpoint requires Basic Authentication with the credentials configured in the DoorDash Developer Portal.',
      test_command: `To test with curl: curl -X POST -H "Content-Type: application/json" -H "Authorization: Basic $(echo -n ':your_password' | base64)" -d '{"event_type":"test", "delivery_id":"test-id","external_delivery_id":"test-ext-id"}' https://[your-ngrok-url]/webhooks/doordash`
    });
  });

  app.post('/webhooks/doordash', validateDoorDashWebhook, async (req: Request, res: Response) => {
    console.log('Received DoorDash webhook request:', {
      headers: { 
        auth: req.headers['authorization'] ? 'Present' : 'Missing'
      },
      body: JSON.stringify(req.body)
    });
    
    try {
      // Add to webhook queue for processing
      const webhookId = await webhookQueue.addToQueue(
        WebhookProvider.DOORDASH,
        req.body,
        req.headers as Record<string, string>
      );

      // Return immediate success response
      res.status(202).json({
        success: true,
        message: 'Webhook received and queued for processing',
        webhookId
      });
    } catch (error) {
      console.error('Error queuing DoorDash webhook:', error);
      res.status(500).json({
        success: false,
        message: 'Error queuing webhook',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Uber webhook routes
  app.get('/webhooks/uber', (req: Request, res: Response) => {
    res.status(200).json({
      message: 'Uber webhook endpoint is active. POST requests with valid Uber signature will be processed.',
      help: 'This endpoint receives webhook events from Uber Direct API.',
      auth: 'This endpoint requires a valid X-Uber-Signature header computed using the client secret.',
      test_command: 'curl -X POST http://localhost:3000/webhooks/uber -H "Content-Type: application/json" -H "X-Uber-Signature: [computed-signature]" -d \'{"event_type":"delivery.status.changed","meta":{"resource_id":"your-order-id","status":"delivered"}}\''
    });
  });

  app.post('/webhooks/uber', validateUberWebhook, async (req: Request, res: Response) => {
    console.log('Received Uber webhook:', {
      headers: { 
        signature: req.headers['x-uber-signature'] ? 'Present' : 'Missing'
      },
      body: JSON.stringify(req.body)
    });
    
    try {
      // Add to webhook queue for processing
      const webhookId = await webhookQueue.addToQueue(
        WebhookProvider.UBER,
        req.body,
        req.headers as Record<string, string>
      );

      // Return immediate success response
      res.status(202).json({
        success: true,
        message: 'Webhook received and queued for processing',
        webhookId
      });
    } catch (error) {
      console.error('Error queuing Uber webhook:', error);
      res.status(500).json({
        success: false,
        message: 'Error queuing webhook',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Webhook management routes
  app.get('/webhooks', (req: Request, res: Response) => {
    // Get all webhooks from storage
    const webhooks = webhookStorage.getAllWebhooks();
    res.status(200).json({
      count: webhooks.length,
      webhooks: webhooks.map(webhook => ({
        id: webhook.id,
        provider: webhook.provider,
        receivedAt: webhook.receivedAt,
        status: webhook.status,
        processingAttempts: webhook.processingAttempts,
        processedAt: webhook.processedAt,
        lastProcessingAttempt: webhook.lastProcessingAttempt
      }))
    });
  });

  app.get('/webhooks/:id', (req: Request, res: Response) => {
    // Get webhook by ID from storage
    const webhook = webhookStorage.getWebhook(req.params.id);
    
    if (!webhook) {
      return res.status(404).json({
        success: false,
        message: `Webhook not found: ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      webhook
    });
  });

  app.get('/webhooks/provider/:provider', (req: Request, res: Response) => {
    // Get webhooks by provider from storage
    try {
      const provider = req.params.provider.toLowerCase() as WebhookProvider;
      if (!Object.values(WebhookProvider).includes(provider)){
        throw new Error(`Invalid provider: ${req.params.provider}`);
      }
      const webhooks = webhookStorage.getWebhooksByProvider(provider);
      
      res.status(200).json({
        success: true,
        count: webhooks.length,
        webhooks: webhooks.map(webhook => ({
          id: webhook.id,
          provider: webhook.provider,
          receivedAt: webhook.receivedAt,
          status: webhook.status,
          processingAttempts: webhook.processingAttempts,
          processedAt: webhook.processedAt,
          lastProcessingAttempt: webhook.lastProcessingAttempt
        }))
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: `Invalid provider or error fetching webhooks: ${req.params.provider}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}
