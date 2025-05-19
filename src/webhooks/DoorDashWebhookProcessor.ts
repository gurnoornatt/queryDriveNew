import { 
  WebhookProcessor, 
  WebhookProcessingResult, 
  WebhookEvent, 
  WebhookEventType, 
  WebhookProvider,
  WebhookDeliveryStatus,
  DeliveryStatusWebhookEvent
} from './types';
import { verifyWebhookSignature } from '../utils/doorDashAuth';
import { WebhookStorage } from './WebhookStorage';

/**
 * Processor for DoorDash webhooks
 */
export class DoorDashWebhookProcessor implements WebhookProcessor {
  private storage: WebhookStorage;
  private developmentMode: boolean;

  constructor() {
    this.storage = WebhookStorage.getInstance();
    // Set to true during development/MVP phase, should be false in production
    this.developmentMode = process.env.NODE_ENV !== 'production';
  }

  /**
   * Process a DoorDash webhook
   * @param rawData Raw webhook data
   * @param headers Request headers
   * @returns Processing result
   */
  async processWebhook(rawData: any, headers?: Record<string, string>): Promise<WebhookProcessingResult> {
    try {
      // Verify webhook signature if not in development mode
      if (headers && !this.developmentMode) {
        const isValid = await this.verifyWebhook(rawData, headers);
        if (!isValid) {
          return {
            success: false,
            message: 'Invalid webhook signature'
          };
        }
      } else if (this.developmentMode) {
        console.log('[DoorDash Webhook] Skipping signature verification in development mode');
      }

      // Store the webhook
      const webhook = this.storage.storeWebhook(WebhookProvider.DOORDASH, rawData);

      // Parse the event
      const event = this.parseWebhookEvent(rawData);
      
      // Process based on event type
      if (event.eventType === WebhookEventType.DELIVERY_STATUS_CHANGED ||
          event.eventType === WebhookEventType.DELIVERY_CREATED) {
        // For status updates, we would update the delivery status in a database
        console.log(`[DoorDash Webhook] Delivery ${event.deliveryId} status: ${(event as DeliveryStatusWebhookEvent).status}`);
        
        // Here you would add code to update the delivery status in your system
        // For example: await deliveryService.updateStatus(event.deliveryId, (event as DeliveryStatusWebhookEvent).status);
      }

      // Update webhook with processing result
      this.storage.updateWebhook(webhook.id, {
        success: true,
        message: `Processed ${event.eventType} event for delivery ${event.deliveryId}`,
        event
      });

      return {
        success: true,
        message: `Processed ${event.eventType} event for delivery ${event.deliveryId}`,
        event
      };
    } catch (error) {
      console.error('[DoorDash Webhook] Processing error:', error);
      return {
        success: false,
        message: `Error processing webhook: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  /**
   * Verify a DoorDash webhook signature
   * @param rawData Raw webhook data
   * @param headers Request headers
   * @returns Whether the webhook is valid
   */
  async verifyWebhook(rawData: any, headers?: Record<string, string>): Promise<boolean> {
    if (!headers) {
      return false;
    }

    // Extract signature and timestamp
    const signature = headers['x-doordash-signature'];
    const timestamp = headers['x-doordash-timestamp'];

    if (!signature || !timestamp) {
      console.error('[DoorDash Webhook] Missing required headers');
      return false;
    }

    // Verify signature
    return verifyWebhookSignature(rawData, signature, timestamp);
  }

  /**
   * Parse a DoorDash webhook event
   * @param rawData Raw webhook data
   * @returns Parsed webhook event
   */
  private parseWebhookEvent(rawData: any): WebhookEvent {
    const eventType = this.mapEventType(rawData.event_type);
    const deliveryId = rawData.data?.delivery_id || '';
    const externalDeliveryId = rawData.data?.external_delivery_id || '';
    
    // Create base event
    const event: WebhookEvent = {
      id: rawData.event_id || `dd-event-${Date.now()}`,
      provider: WebhookProvider.DOORDASH,
      eventType,
      timestamp: rawData.created_at ? new Date(rawData.created_at) : new Date(),
      deliveryId,
      externalDeliveryId,
      rawData
    };

    // For status updates, add status information
    if (eventType === WebhookEventType.DELIVERY_STATUS_CHANGED || 
        eventType === WebhookEventType.DELIVERY_CREATED) {
      const statusEvent: DeliveryStatusWebhookEvent = {
        ...event,
        status: this.mapDeliveryStatus(rawData.data?.delivery_status),
        statusDetails: rawData.data?.status_details || '',
        estimatedDeliveryTime: rawData.data?.estimated_delivery_time 
          ? new Date(rawData.data.estimated_delivery_time) 
          : undefined
      };
      return statusEvent;
    }

    return event;
  }

  /**
   * Map DoorDash event type to standardized event type
   * @param doorDashEventType DoorDash event type
   * @returns Standardized event type
   */
  private mapEventType(doorDashEventType: string): WebhookEventType {
    switch (doorDashEventType) {
      case 'delivery_created':
        return WebhookEventType.DELIVERY_CREATED;
      case 'delivery_status_update':
        return WebhookEventType.DELIVERY_STATUS_CHANGED;
      default:
        return WebhookEventType.UNKNOWN;
    }
  }

  /**
   * Map DoorDash delivery status to standardized status
   * @param doorDashStatus DoorDash delivery status
   * @returns Standardized delivery status
   */
  private mapDeliveryStatus(doorDashStatus: string): WebhookDeliveryStatus {
    switch (doorDashStatus) {
      case 'created':
        return WebhookDeliveryStatus.PENDING;
      case 'dasher_assigned':
        return WebhookDeliveryStatus.ASSIGNED;
      case 'picked_up':
        return WebhookDeliveryStatus.PICKUP;
      case 'en_route_to_dropoff':
        return WebhookDeliveryStatus.IN_TRANSIT;
      case 'delivered':
        return WebhookDeliveryStatus.DELIVERED;
      case 'delivery_failed':
        return WebhookDeliveryStatus.FAILED;
      case 'canceled':
        return WebhookDeliveryStatus.CANCELLED;
      default:
        return WebhookDeliveryStatus.UNKNOWN;
    }
  }
} 