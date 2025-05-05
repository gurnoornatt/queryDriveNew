import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Uber Direct API client
 *
 * This client handles interactions with the Uber Direct API,
 * including estimates, delivery creation, and webhook processing.
 */

// Uber Direct API interfaces
export interface UberQuoteRequest {
  pickup_address: string; // JSON stringified address
  dropoff_address: string; // JSON stringified address
  pickup_latitude?: number;
  pickup_longitude?: number;
  dropoff_latitude?: number;
  dropoff_longitude?: number;
}

export interface UberQuoteResponse {
  kind: string;
  id: string;
  created: string;
  expires: string;
  fee: number;
  currency: string;
  currency_type: string;
  dropoff_eta: string;
  duration: number;
  pickup_duration: number;
  dropoff_deadline: string;
}

export interface UberDeliveryRequest {
  quote_id: string;
  pickup_address: string; // JSON stringified address
  pickup_name: string;
  pickup_phone_number: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  dropoff_address: string; // JSON stringified address
  dropoff_name: string;
  dropoff_phone_number: string;
  dropoff_latitude?: number;
  dropoff_longitude?: number;
  manifest_items: UberManifestItem[];
}

export interface UberDeliveryResponse {
  id: string;
  status: string;
  tracking_url: string;
  fee?: number;
  courier?: {
    name?: string;
    phone_number?: string;
    location?: {
      lat: number;
      lng: number;
    }
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

export interface UberManifestItem {
  name: string;
  quantity: number;
  weight?: number;
  dimensions?: {
    length: number;
    height: number;
    depth: number;
  };
}

// Access token storage
let accessToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Gets an OAuth token from Uber
 */
export const getAuthToken = async (): Promise<string> => {
  try {
    // Check if we have a valid token
    const now = Math.floor(Date.now() / 1000);
    if (accessToken && tokenExpiry > now) {
      return accessToken;
    }

    // Get client credentials from environment variables
    const clientId = process.env.UBER_CLIENT_ID;
    const clientSecret = process.env.UBER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Missing Uber API credentials. Please check your .env file.');
    }

    // Request a new token
    const response = await axios.post(
      'https://auth.uber.com/oauth/v2/token',
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
        scope: 'eats.deliveries'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    // Store the token and calculate expiry
    accessToken = response.data.access_token;
    // Set expiry with a 5-minute buffer
    tokenExpiry = Math.floor(Date.now() / 1000) + response.data.expires_in - 300;

    if (!accessToken) {
      throw new Error('Failed to obtain access token from Uber');
    }

    return accessToken;
  } catch (error) {
    console.error('Error obtaining Uber OAuth token:', error);
    throw new Error(`Failed to authenticate with Uber: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Gets a delivery quote from Uber
 */
export const getQuote = async (quoteRequest: UberQuoteRequest): Promise<UberQuoteResponse> => {
  try {
    const token = await getAuthToken();
    const customerId = process.env.UBER_CUSTOMER_ID;

    if (!customerId) {
      throw new Error('Missing UBER_CUSTOMER_ID. Please check your .env file.');
    }

    const response = await axios.post(
      `https://api.uber.com/v1/customers/${customerId}/delivery_quotes`,
      quoteRequest,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error getting Uber delivery quote:', error);
    throw new Error(`Failed to get Uber delivery quote: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Creates a delivery with Uber
 */
export const createDelivery = async (deliveryRequest: UberDeliveryRequest): Promise<UberDeliveryResponse> => {
  try {
    const token = await getAuthToken();
    const customerId = process.env.UBER_CUSTOMER_ID;

    if (!customerId) {
      throw new Error('Missing UBER_CUSTOMER_ID. Please check your .env file.');
    }

    const response = await axios.post(
      `https://api.uber.com/v1/customers/${customerId}/deliveries`,
      deliveryRequest,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error creating Uber delivery:', error);
    throw new Error(`Failed to create Uber delivery: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get delivery status from Uber
 */
export const getDeliveryStatus = async (deliveryId: string): Promise<UberDeliveryResponse> => {
  try {
    const token = await getAuthToken();
    const customerId = process.env.UBER_CUSTOMER_ID;

    if (!customerId) {
      throw new Error('Missing UBER_CUSTOMER_ID. Please check your .env file.');
    }

    const response = await axios.get(
      `https://api.uber.com/v1/customers/${customerId}/deliveries/${deliveryId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error getting Uber delivery status:', error);
    throw new Error(`Failed to get Uber delivery status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Parses and validates an Uber webhook
 */
export const parseWebhook = async (payload: UberWebhookPayload): Promise<UberDeliveryResponse> => {
  try {
    // Process the webhook payload based on event type
    const { event_type, meta } = payload;
    
    // Get detailed delivery information
    return await getDeliveryStatus(meta.resource_id);
  } catch (error) {
    console.error('Error processing Uber webhook:', error);
    throw new Error(`Failed to process Uber webhook: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
