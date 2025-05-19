import { v4 as uuidv4 } from 'uuid';
import { 
  WebhookProcessor, 
  WebhookProcessingResult, 
  WebhookEvent,
  WebhookProvider,
  WebhookEventType
} from './types';

/**
 * Base class for all webhook processors
 * Provides common functionality and enforces implementation of provider-specific methods
 */
export abstract class BaseWebhookProcessor implements WebhookProcessor {
  protected provider: WebhookProvider;

  constructor(provider: WebhookProvider) {
    this.provider = provider;
  }

  /**
   * Process a webhook payload
   * @param rawData The raw webhook payload
   * @param headers The request headers
   * @returns Processing result
   */
  async processWebhook(rawData: any, headers?: Record<string, string>): Promise<WebhookProcessingResult> {
    try {
      // Verify webhook signature
      const isValid = await this.verifyWebhook(rawData, headers);
      if (!isValid) {
        return {
          success: false,
          message: 'Invalid webhook signature',
          error: new Error('Invalid webhook signature')
        };
      }

      // Parse webhook data into standardized event
      const event = await this.parseWebhookData(rawData, headers);
      
      // Process the event based on type
      await this.handleEvent(event);

      return {
        success: true,
        message: 'Webhook processed successfully',
        event
      };
    } catch (error) {
      console.error(`Error processing webhook: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        success: false,
        message: `Error processing webhook: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  /**
   * Verify webhook signature
   * @param rawData The raw webhook payload
   * @param headers The request headers
   * @returns Whether the webhook signature is valid
   */
  abstract verifyWebhook(rawData: any, headers?: Record<string, string>): Promise<boolean>;

  /**
   * Parse webhook data into standardized event
   * @param rawData The raw webhook payload
   * @param headers The request headers
   * @returns Standardized webhook event
   */
  abstract parseWebhookData(rawData: any, headers?: Record<string, string>): Promise<WebhookEvent>;

  /**
   * Handle a webhook event
   * @param event The webhook event
   */
  protected async handleEvent(event: WebhookEvent): Promise<void> {
    console.log(`Processing ${this.provider} webhook event: ${event.eventType} for delivery ${event.deliveryId}`);
    
    // Implement common event handling logic here
    // Provider-specific processors can override this method to add custom logic
    
    // Example: Update delivery status in database
    // await this.updateDeliveryStatus(event);
    
    // Example: Notify customers about delivery updates
    // await this.notifyCustomer(event);
  }

  /**
   * Generate a unique ID for a webhook event
   * @returns Unique ID
   */
  protected generateEventId(): string {
    return uuidv4();
  }
} 