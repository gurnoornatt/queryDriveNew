import axios from 'axios';
import crypto from 'crypto';
import { WebhookProvider, WebhookEventType } from './types';

// Get DoorDash Developer ID from environment for signature generation
const DD_DEVELOPER_ID = process.env.DD_DEVELOPER_ID || 'test-dev-id'; // Fallback for safety, though real one should be in .env

/**
 * Utility for testing webhooks
 */
export class WebhookTestUtil {
  private baseUrl: string;
  private uberClientSecret: string;
  private doorDashSigningSecret: string;

  /**
   * Create a new webhook test utility
   * @param baseUrl Base URL for the API (e.g., http://localhost:3000)
   * @param uberClientSecret Uber client secret for signing webhooks
   * @param doorDashSigningSecret DoorDash signing secret for signing webhooks
   */
  constructor(
    baseUrl: string = 'http://localhost:3000',
    uberClientSecret: string = process.env.UBER_CLIENT_SECRET || 'test-secret',
    doorDashSigningSecret: string = process.env.DD_SIGNING_SECRET || 'test-secret'
  ) {
    this.baseUrl = baseUrl;
    this.uberClientSecret = uberClientSecret;
    this.doorDashSigningSecret = doorDashSigningSecret;
  }

  /**
   * Send a test DoorDash webhook
   * @param eventType Event type
   * @param deliveryId Delivery ID
   * @param externalDeliveryId External delivery ID
   * @param status Delivery status
   * @returns Webhook response
   */
  async sendDoorDashWebhook(
    eventType: string = 'delivery_status_update',
    deliveryId: string = 'dd-test-delivery-' + Date.now(),
    externalDeliveryId: string = 'test-external-' + Date.now(),
    status: string = 'delivered'
  ): Promise<any> {
    // Create webhook payload
    const payload = {
      event_type: eventType,
      event_id: 'test-event-' + Date.now(),
      created_at: new Date().toISOString(),
      data: {
        delivery_id: deliveryId,
        external_delivery_id: externalDeliveryId,
        delivery_status: status,
        status_time: new Date().toISOString()
      }
    };

    // Generate timestamp
    const timestamp = Math.floor(Date.now() / 1000).toString();

    // Generate signature
    const hexSignature = this.generateDoorDashSignature(payload, timestamp);
    // Format signature as expected by DoorDash: t=<timestamp>,v1=<signature>
    const fullSignature = `t=${timestamp},v1=${hexSignature}`;

    // Send webhook
    try {
      const response = await axios.post(
        `${this.baseUrl}/webhooks/doordash`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-DoorDash-Signature': fullSignature, // Send the fully formatted signature
            'X-DoorDash-Signature-Timestamp': timestamp
          }
        }
      );

      console.log('DoorDash webhook sent successfully:', response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error('Error sending DoorDash webhook:', error.response.data);
        return error.response.data;
      }
      throw error;
    }
  }

  /**
   * Send a test Uber webhook
   * @param eventType Event type
   * @param deliveryId Delivery ID
   * @param status Delivery status
   * @returns Webhook response
   */
  async sendUberWebhook(
    eventType: string = 'delivery.status.changed',
    deliveryId: string = 'uber-test-delivery-' + Date.now(),
    status: string = 'delivered'
  ): Promise<any> {
    // Create webhook payload
    const payload = {
      event_type: eventType,
      event_id: 'test-event-' + Date.now(),
      meta: {
        resource_id: deliveryId,
        status: status,
        timestamp: Math.floor(Date.now() / 1000)
      },
      event_time: Math.floor(Date.now() / 1000),
      resource: {
        delivery_status: status,
        courier: {
          location: {
            latitude: 37.7749,
            longitude: -122.4194
          }
        },
        dropoff: {
          expected_delivery_time: Math.floor(Date.now() / 1000) + 600 // 10 minutes from now
        }
      }
    };

    // Generate signature
    const signature = this.generateUberSignature(payload);

    // Send webhook
    try {
      const response = await axios.post(
        `${this.baseUrl}/webhooks/uber`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Uber-Signature': signature
          }
        }
      );

      console.log('Uber webhook sent successfully:', response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error('Error sending Uber webhook:', error.response.data);
        return error.response.data;
      }
      throw error;
    }
  }

  /**
   * Generate a DoorDash webhook signature
   * @param payload Webhook payload
   * @param timestamp Timestamp
   * @returns Signature
   */
  private generateDoorDashSignature(payload: any, timestamp: string): string {
    // Construct the message to sign: timestamp + developer_id + request_body
    const stringToSign = `${timestamp}${DD_DEVELOPER_ID}${JSON.stringify(payload)}`;
    
    return crypto
      .createHmac('sha256', this.doorDashSigningSecret)
      .update(stringToSign)
      .digest('hex');
  }

  /**
   * Generate an Uber webhook signature
   * @param payload Webhook payload
   * @returns Signature
   */
  private generateUberSignature(payload: any): string {
    return crypto
      .createHmac('sha256', this.uberClientSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  /**
   * Send a full delivery lifecycle of webhooks for testing
   * @param provider Webhook provider
   * @param deliveryId Delivery ID
   * @param externalDeliveryId External delivery ID (for DoorDash)
   * @returns Array of webhook responses
   */
  async simulateDeliveryLifecycle(
    provider: WebhookProvider | string,
    deliveryId: string = 'test-delivery-' + Date.now(),
    externalDeliveryId?: string
  ): Promise<any[]> {
    // Convert string provider to enum if needed
    const providerEnum = typeof provider === 'string'
      ? this.getProviderEnum(provider)
      : provider;
    
    // Generate external delivery ID if not provided
    const extDeliveryId = externalDeliveryId || 'ext-' + deliveryId;
    
    // Define delivery lifecycle statuses
    const lifecycleStatuses = [
      { event: 'created', status: 'created' },
      { event: 'assigned', status: providerEnum === WebhookProvider.DOORDASH ? 'dasher_assigned' : 'courier_assigned' },
      { event: 'pickup', status: 'picked_up' },
      { event: 'in_transit', status: 'en_route_to_dropoff' },
      { event: 'delivered', status: 'delivered' }
    ];
    
    const responses: any[] = [];
    
    // Send webhooks for each status
    for (const stage of lifecycleStatuses) {
      // Wait a bit between webhooks to simulate real-world timing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let response;
      if (providerEnum === WebhookProvider.DOORDASH) {
        response = await this.sendDoorDashWebhook(
          stage.event === 'created' ? 'delivery_created' : 'delivery_status_update',
          deliveryId,
          extDeliveryId,
          stage.status
        );
      } else if (providerEnum === WebhookProvider.UBER) {
        response = await this.sendUberWebhook(
          stage.event === 'created' ? 'delivery.created' : 'delivery.status.changed',
          deliveryId,
          stage.status
        );
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }
      
      responses.push(response);
      console.log(`Simulated ${stage.event} webhook for ${providerEnum}`);
    }
    
    return responses;
  }

  /**
   * Convert a provider string to enum
   * @param provider The provider string
   * @returns The provider enum
   */
  private getProviderEnum(provider: string): WebhookProvider {
    const normalizedProvider = provider.toLowerCase();
    
    switch (normalizedProvider) {
      case 'doordash':
        return WebhookProvider.DOORDASH;
      case 'uber':
        return WebhookProvider.UBER;
      default:
        return WebhookProvider.UNKNOWN;
    }
  }
} 