// import axios from 'axios';  // Will be used in Phase 2 implementation

/**
 * Uber Direct API client
 *
 * This client handles interactions with the Uber Direct API,
 * including estimates, delivery creation, and webhook processing.
 */

// Uber Direct API interfaces
export interface UberQuoteRequest {
  pickup_address: UberAddress;
  dropoff_address: UberAddress;
  manifest: UberManifest;
  pickup_ready_dt?: string;
  pickup_deadline_dt?: string;
  dropoff_ready_dt?: string;
  dropoff_deadline_dt?: string;
}

export interface UberQuoteResponse {
  id: string;
  fee: {
    amount: number;
    currency: string;
  };
  expires_at: string;
}

export interface UberDeliveryRequest {
  quote_id: string;
  external_id?: string;
  pickup: UberLocation;
  dropoff: UberLocation;
  manifest: UberManifest;
}

export interface UberDeliveryResponse {
  id: string;
  status: string;
  tracking_url: string;
  fee: {
    amount: number;
    currency: string;
  };
}

export interface UberWebhookPayload {
  event_type: string;
  meta: {
    resource_id: string;
    status: string;
    timestamp: number;
  };
  data: Record<string, unknown>; // Using a more specific type instead of any
}

interface UberAddress {
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

interface UberLocation {
  address: UberAddress;
  contact: {
    name?: string;
    phone_number?: string;
    instructions?: string;
  };
}

interface UberManifest {
  description: string;
  items: UberItem[];
}

interface UberItem {
  name: string;
  quantity: number;
  size?: string;
  price?: number;
}

/**
 * Gets a delivery estimate from Uber
 */
export const estimate = async () => {
  // To be implemented in Phase 2
  throw new Error('Not implemented yet');
};

/**
 * Creates a delivery with Uber
 */
export const createDelivery = async () => {
  // To be implemented in Phase 2
  throw new Error('Not implemented yet');
};

/**
 * Parses and validates an Uber webhook
 */
export const parseWebhook = async () => {
  // To be implemented in Phase 2
  throw new Error('Not implemented yet');
};
