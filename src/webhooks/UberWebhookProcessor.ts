import { 
  WebhookProcessor, 
  WebhookProcessingResult, 
  WebhookEvent, 
  WebhookEventType, 
  WebhookProvider,
  WebhookDeliveryStatus,
  DeliveryStatusWebhookEvent
} from './types';
import crypto from 'crypto';
import { WebhookStorage } from './WebhookStorage';

/**
 * Processor for Uber webhooks
 */
export class UberWebhookProcessor implements WebhookProcessor {
  private storage: WebhookStorage;
  private clientSecret: string;
  private readonly isDevelopmentMode: boolean;

  constructor(
    clientSecret: string = process.env.UBER_CLIENT_SECRET || '', 
    isDevelopmentMode: boolean = process.env.NODE_ENV === 'development' && process.env.BYPASS_WEBHOOK_VERIFICATION === 'true'
  ) {
    this.storage = WebhookStorage.getInstance();
    this.clientSecret = clientSecret;
    this.isDevelopmentMode = isDevelopmentMode;
    
    if (this.isDevelopmentMode) {
      console.warn('[Uber Webhook] Running in development mode with signature verification bypass enabled');
    }
  }

  /**
   * Process an Uber webhook
   * @param rawData Raw webhook data
   * @param headers Request headers
   * @returns Processing result
   */
  async processWebhook(rawData: any, headers?: Record<string, string>): Promise<WebhookProcessingResult> {
    try {
      // Verify webhook signature (unless in development mode with bypass enabled)
      if (headers && !this.isDevelopmentMode) {
        const isValid = await this.verifyWebhook(rawData, headers);
        if (!isValid) {
          return {
            success: false,
            message: 'Invalid webhook signature'
          };
        }
      } else if (this.isDevelopmentMode) {
        console.log('[Uber Webhook] Development mode - bypassing signature verification for processing');
      }

      // Store the webhook
      const webhook = this.storage.storeWebhook(WebhookProvider.UBER, rawData);

      // Parse the event
      const event = this.parseWebhookEvent(rawData);
      
      // Process based on event type
      if (event.eventType === WebhookEventType.DELIVERY_STATUS_CHANGED ||
          event.eventType === WebhookEventType.DELIVERY_CREATED ||
          event.eventType === WebhookEventType.DELIVERY_PICKUP ||
          event.eventType === WebhookEventType.DELIVERY_COMPLETED ||
          event.eventType === WebhookEventType.DELIVERY_CANCELLED) {
          
        const statusEvent = event as DeliveryStatusWebhookEvent;
        
        console.log(`[Uber Webhook] Delivery ${event.deliveryId} status: ${statusEvent.status}`);
        
        if (statusEvent.trackingUrl) {
          console.log(`[Uber Webhook] Tracking URL: ${statusEvent.trackingUrl}`);
          
          // Here you would add code to store the tracking URL in your database
          // For example: await deliveryService.updateTrackingUrl(event.deliveryId, statusEvent.trackingUrl);
        }
        
        // Here you would add code to update the delivery status in your database
        // For example: await deliveryService.updateStatus(event.deliveryId, statusEvent.status);
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
      console.error('[Uber Webhook] Processing error:', error);
      return {
        success: false,
        message: `Error processing webhook: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  /**
   * Verify an Uber webhook signature
   * @param rawData Raw webhook data
   * @param headers Request headers
   * @returns Whether the webhook is valid
   */
  async verifyWebhook(rawData: any, headers?: Record<string, string>): Promise<boolean> {
    // Skip verification in development mode if bypass enabled
    if (this.isDevelopmentMode) {
      console.log('[Uber Webhook] Development mode - bypassing signature verification');
      return true;
    }

    if (!headers) {
      return false;
    }

    // Extract signature - Uber uses x-uber-signature according to the documentation
    const signature = headers['x-uber-signature'] || headers['x-postmates-signature'];

    if (!signature) {
      console.error('[Uber Webhook] Missing signature header');
      return false;
    }

    if (!this.clientSecret) {
      console.error('[Uber Webhook] Missing client secret');
      return false;
    }

    // Verify signature
    const computedSignature = crypto
      .createHmac('sha256', this.clientSecret)
      .update(JSON.stringify(rawData))
      .digest('hex');

    const isValid = signature === computedSignature;
    
    if (!isValid) {
      console.error('[Uber Webhook] Invalid signature');
      console.debug(`[Uber Webhook] Expected: ${computedSignature}, Received: ${signature}`);
    }
    
    return isValid;
  }

  /**
   * Parse an Uber webhook event
   * @param rawData Raw webhook data
   * @returns Parsed webhook event
   */
  private parseWebhookEvent(rawData: any): WebhookEvent {
    // Normalize field names between Uber Eats and Direct API
    // Uber Direct uses different formats for their webhooks than legacy API
    const eventType = rawData.kind || rawData.event_type;
    const deliveryId = 
        rawData.delivery_id || 
        (rawData.meta && rawData.meta.resource_id) ||
        (rawData.data && rawData.data.id) ||
        '';
    
    const timestamp = rawData.created
      ? new Date(rawData.created)
      : rawData.event_time
        ? new Date(rawData.event_time * 1000)
        : new Date();
    
    // Create base event
    const event: WebhookEvent = {
      id: rawData.id || `uber-event-${Date.now()}`,
      provider: WebhookProvider.UBER,
      eventType: this.mapEventType(eventType),
      timestamp,
      deliveryId,
      rawData
    };

    // For status updates, add status information
    if (event.eventType === WebhookEventType.DELIVERY_STATUS_CHANGED || 
        event.eventType === WebhookEventType.DELIVERY_CREATED ||
        event.eventType === WebhookEventType.DELIVERY_PICKUP ||
        event.eventType === WebhookEventType.DELIVERY_COMPLETED ||
        event.eventType === WebhookEventType.DELIVERY_CANCELLED) {
      
      // Extract status from the right place depending on the webhook format
      const status = rawData.status || 
        (rawData.meta && rawData.meta.status) || 
        (rawData.data && rawData.data.status) || 
        'unknown';
      
      // Extract location information
      const location = rawData.location || 
        (rawData.data && rawData.data.courier && rawData.data.courier.location) || 
        undefined;
      
      // Extract tracking URL from the data object
      const trackingUrl = rawData.data && rawData.data.tracking_url;
      
      // Extract dropoff_eta for estimated delivery time
      const dropoffEta = rawData.data && rawData.data.dropoff_eta;
      
      const statusEvent: DeliveryStatusWebhookEvent = {
        ...event,
        status: this.mapDeliveryStatus(status),
        statusDetails: status,
        location: location ? {
          latitude: location.lat || location.latitude,
          longitude: location.lng || location.longitude
        } : undefined,
        estimatedDeliveryTime: dropoffEta ? new Date(dropoffEta) : undefined,
        trackingUrl: trackingUrl || undefined
      };
      return statusEvent;
    }

    return event;
  }

  /**
   * Map Uber event type to standardized event type
   * @param uberEventType Uber event type
   * @returns Standardized event type
   */
  private mapEventType(uberEventType: string): WebhookEventType {
    if (!uberEventType) {
      return WebhookEventType.UNKNOWN;
    }
    
    const normalizedType = uberEventType.toLowerCase();
    
    // Direct API event types
    if (normalizedType === 'event.delivery_status') {
      return WebhookEventType.DELIVERY_STATUS_CHANGED;
    }
    if (normalizedType === 'event.courier_update') {
      return WebhookEventType.COURIER_LOCATION_UPDATED;
    }
    
    // Legacy API event types
    if (normalizedType.includes('delivery.created')) {
      return WebhookEventType.DELIVERY_CREATED;
    }
    if (normalizedType.includes('status.changed')) {
      return WebhookEventType.DELIVERY_STATUS_CHANGED;
    }
    if (normalizedType.includes('pickup.completed')) {
      return WebhookEventType.DELIVERY_PICKUP;
    }
    if (normalizedType.includes('delivery.completed')) {
      return WebhookEventType.DELIVERY_COMPLETED;
    }
    if (normalizedType.includes('cancelled') || normalizedType.includes('canceled')) {
      return WebhookEventType.DELIVERY_CANCELLED;
    }
    
    console.warn(`[Uber Webhook] Unknown event type: ${uberEventType}`);
    return WebhookEventType.UNKNOWN;
  }

  /**
   * Map Uber delivery status to standardized status
   * @param uberStatus Uber delivery status
   * @returns Standardized delivery status
   */
  private mapDeliveryStatus(uberStatus: string): WebhookDeliveryStatus {
    if (!uberStatus) {
      return WebhookDeliveryStatus.UNKNOWN;
    }
    
    const normalizedStatus = uberStatus.toLowerCase();
    
    // Direct API statuses
    switch (normalizedStatus) {
      // Statuses from event.delivery_status webhook
      case 'pending':
        return WebhookDeliveryStatus.PENDING;
      case 'pickup':
        return WebhookDeliveryStatus.ASSIGNED;
      case 'pickup_complete':
        return WebhookDeliveryStatus.PICKUP;
      case 'dropoff':
        return WebhookDeliveryStatus.IN_TRANSIT;
      case 'delivered':
        return WebhookDeliveryStatus.DELIVERED;
      case 'canceled':
      case 'cancelled': 
        return WebhookDeliveryStatus.CANCELLED;
      case 'returned':
        return WebhookDeliveryStatus.RETURNED;
        
      // Legacy API statuses
      case 'created':
        return WebhookDeliveryStatus.PENDING;
      case 'courier_assigned':
      case 'accepted':
        return WebhookDeliveryStatus.ASSIGNED;
      case 'picked_up':
        return WebhookDeliveryStatus.PICKUP;
      case 'in_transit':
      case 'en_route_to_dropoff':
        return WebhookDeliveryStatus.IN_TRANSIT;
      case 'completed':
        return WebhookDeliveryStatus.DELIVERED;
      case 'failed':
      case 'delivery_failed':
        return WebhookDeliveryStatus.FAILED;
        
      default:
        console.warn(`[Uber Webhook] Unknown status: ${uberStatus}`);
        return WebhookDeliveryStatus.UNKNOWN;
    }
  }
} 