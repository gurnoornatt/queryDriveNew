/**
 * Standardized webhook event types across providers
 */
export enum WebhookEventType {
  DELIVERY_CREATED = 'delivery.created',
  DELIVERY_PICKUP = 'delivery.pickup',
  DELIVERY_IN_PROGRESS = 'delivery.in_progress',
  DELIVERY_COMPLETED = 'delivery.completed',
  DELIVERY_FAILED = 'delivery.failed',
  DELIVERY_CANCELLED = 'delivery.cancelled',
  DELIVERY_RETURNED = 'delivery.returned',
  DELIVERY_STATUS_CHANGED = 'delivery.status_changed',
  COURIER_LOCATION_UPDATED = 'courier.location.updated',
  UNKNOWN = 'unknown'
}

/**
 * Standardized delivery status across providers
 */
export enum WebhookDeliveryStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  PICKUP = 'pickup',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
  UNKNOWN = 'unknown'
}

/**
 * Provider types for webhook sources
 */
export enum WebhookProvider {
  DOORDASH = 'doordash',
  UBER = 'uber',
  UNKNOWN = 'unknown'
}

/**
 * Base interface for all webhook events
 */
export interface WebhookEvent {
  id: string;
  provider: WebhookProvider;
  eventType: WebhookEventType;
  timestamp: Date;
  deliveryId: string;
  externalDeliveryId?: string;
  rawData: any;
}

/**
 * Interface for delivery status update webhook events
 */
export interface DeliveryStatusWebhookEvent extends WebhookEvent {
  status: WebhookDeliveryStatus;
  statusDetails: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  estimatedDeliveryTime?: Date;
  trackingUrl?: string;
}

/**
 * Interface for webhook processing result
 */
export interface WebhookProcessingResult {
  success: boolean;
  message: string;
  event?: WebhookEvent;
  error?: Error;
}

/**
 * Interface for webhook storage record
 */
export interface WebhookStorageRecord {
  id: string;
  provider: WebhookProvider;
  receivedAt: Date;
  processedAt?: Date;
  processingAttempts: number;
  lastProcessingAttempt?: Date;
  status: 'pending' | 'processed' | 'failed';
  rawData: any;
  headers?: Record<string, string>;
  processingResult?: WebhookProcessingResult;
}

/**
 * Interface for webhook processor
 */
export interface WebhookProcessor {
  processWebhook(rawData: any, headers?: Record<string, string>): Promise<WebhookProcessingResult>;
  verifyWebhook(rawData: any, headers?: Record<string, string>): Promise<boolean>;
} 