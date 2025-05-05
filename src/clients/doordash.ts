// import axios from 'axios';  // Will be used in Phase 1 implementation
import { doorDashAPI } from '../services/doordash';

/**
 * DoorDash Drive API client
 *
 * This client handles interactions with the DoorDash Drive API,
 * including estimates, delivery creation, and webhook processing.
 */

// DoorDash Drive API interfaces
export interface DoorDashQuoteRequest {
  external_delivery_id: string;
  pickup_address: Address;
  dropoff_address: Address;
  pickup_business_name?: string;
  dropoff_business_name?: string;
  dropoff_phone_number?: string;
  pickup_phone_number?: string;
  dropoff_instructions?: string;
  pickup_instructions?: string;
  order_value?: number;
}

export interface DoorDashQuoteResponse {
  external_delivery_id: string;
  quote_id: string;
  currency: string;
  fee: number;
  expires_at: string;
}

export interface DoorDashDeliveryRequest {
  external_delivery_id: string;
  pickup_address: Address;
  dropoff_address: Address;
  pickup_business_name?: string;
  dropoff_business_name?: string;
  dropoff_phone_number?: string;
  pickup_phone_number?: string;
  dropoff_instructions?: string;
  pickup_instructions?: string;
  order_value?: number;
  items?: DeliveryItem[];
}

export interface DoorDashDeliveryResponse {
  external_delivery_id: string;
  delivery_id: string;
  delivery_status: string;
  tracking_url: string;
  fee: number;
  currency: string;
}

/**
 * Interface for DoorDash webhook payload
 */
export interface DoorDashWebhookPayload {
  event_type: string;
  delivery_id: string;
  external_delivery_id: string;
  status?: string;
  estimated_delivery_time?: string;
  fee?: number;
  currency?: string;
  driver_location?: {
    lat: number;
    lng: number;
  };
  error_detail?: {
    code: string;
    message: string;
  };
}

interface Address {
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

interface DeliveryItem {
  name: string;
  quantity: number;
  description?: string;
}

/**
 * Gets a delivery estimate from DoorDash
 * 
 * @param quoteRequest - The request details for getting a delivery quote
 * @returns Promise with the quote response
 */
export const estimate = async (quoteRequest: DoorDashQuoteRequest): Promise<DoorDashQuoteResponse> => {
  try {
    // Convert the client's request format to the service API format
    // Currently they match, but we keep this transformation for future compatibility
    const apiRequest = {
      external_delivery_id: quoteRequest.external_delivery_id,
      pickup_address: quoteRequest.pickup_address,
      dropoff_address: quoteRequest.dropoff_address,
      pickup_business_name: quoteRequest.pickup_business_name,
      dropoff_business_name: quoteRequest.dropoff_business_name,
      pickup_phone_number: quoteRequest.pickup_phone_number,
      dropoff_phone_number: quoteRequest.dropoff_phone_number,
      pickup_instructions: quoteRequest.pickup_instructions,
      dropoff_instructions: quoteRequest.dropoff_instructions,
      order_value: quoteRequest.order_value
    };

    // Call the DoorDash API service to get a quote
    const response = await doorDashAPI.getDeliveryQuote(apiRequest);

    // Convert the service response to the client's response format
    return {
      external_delivery_id: response.external_delivery_id || quoteRequest.external_delivery_id,
      quote_id: response.quote_id,
      currency: response.currency,
      fee: response.fee,
      expires_at: response.expires_at
    };
  } catch (error) {
    console.error('Error getting DoorDash delivery estimate:', error);
    throw error;
  }
};

/**
 * Creates a delivery with DoorDash
 * 
 * @param deliveryRequest - The delivery details
 * @returns Promise with the delivery response
 */
export const createDelivery = async (deliveryRequest: DoorDashDeliveryRequest): Promise<DoorDashDeliveryResponse> => {
  try {
    // Convert the client's request format to the service API format
    // This is a simplified mapping as they may not match perfectly
    const apiRequest = {
      external_delivery_id: deliveryRequest.external_delivery_id,
      pickup_address: deliveryRequest.pickup_address,
      dropoff_address: deliveryRequest.dropoff_address,
      pickup_business_name: deliveryRequest.pickup_business_name,
      dropoff_business_name: deliveryRequest.dropoff_business_name,
      pickup_phone_number: deliveryRequest.pickup_phone_number,
      dropoff_phone_number: deliveryRequest.dropoff_phone_number,
      pickup_instructions: deliveryRequest.pickup_instructions,
      dropoff_instructions: deliveryRequest.dropoff_instructions,
      order_value: deliveryRequest.order_value,
      items: deliveryRequest.items,
      // Add any missing required fields for the API
      pickup_contact: {
        first_name: deliveryRequest.pickup_business_name || 'Contact',
        phone_number: deliveryRequest.pickup_phone_number || '',
      },
      dropoff_contact: {
        first_name: deliveryRequest.dropoff_business_name || 'Contact',
        phone_number: deliveryRequest.dropoff_phone_number || '',
      },
    };

    // Call the DoorDash API service to create a delivery
    const response = await doorDashAPI.createDelivery(apiRequest);

    // Convert the service response to the client's response format
    return {
      external_delivery_id: response.external_delivery_id || deliveryRequest.external_delivery_id,
      delivery_id: response.id || '',
      delivery_status: response.status || 'created',
      tracking_url: response.tracking_url || '',
      fee: response.fee || 0,
      currency: response.currency || 'USD',
    };
  } catch (error) {
    console.error('Error creating DoorDash delivery:', error);
    throw error;
  }
};

/**
 * Parses and validates a DoorDash webhook
 * 
 * @param signature - X-DoorDash-Signature header from the request
 * @param timestamp - X-DoorDash-Timestamp header from the request
 * @param rawBody - Raw request body as a string
 * @returns Object with validation result and parsed payload
 */
export const parseWebhook = async (
  signature: string,
  timestamp: string,
  rawBody: string
): Promise<{
  isValid: boolean;
  payload?: DoorDashWebhookPayload;
}> => {
  try {
    // Check for required parameters
    if (!signature || !timestamp || !rawBody) {
      return { isValid: false };
    }

    // Import verification function
    const { verifyWebhookSignature } = await import('../utils/doorDashAuth.js');

    // Verify the signature
    const isValid = verifyWebhookSignature(signature, timestamp, rawBody);
    
    // If signature is invalid, return early
    if (!isValid) {
      return { isValid: false };
    }

    // Parse the raw body
    let payload: DoorDashWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      console.error('Error parsing webhook JSON:', error);
      return { isValid: false };
    }

    // Validate required fields in the payload
    if (!payload.event_type || !payload.delivery_id) {
      console.error('Webhook payload missing required fields');
      return { isValid: false };
    }

    // Return validated payload
    return {
      isValid: true,
      payload,
    };
  } catch (error) {
    console.error('Error parsing DoorDash webhook:', error);
    return { isValid: false };
  }
};
