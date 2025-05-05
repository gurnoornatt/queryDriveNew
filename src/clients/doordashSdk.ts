import { v4 as uuidv4 } from 'uuid';
import { doorDashSDK } from '../services/doordash-sdk/client';
import { verifyWebhookSignature } from '../utils/doorDashAuth';

/**
 * DoorDash Drive API client using the official SDK
 *
 * This client provides an interface compatible with our existing client
 * but uses the official DoorDash SDK internally.
 */

// Define interfaces consistent with our existing client
export interface DoorDashQuoteRequest {
  external_delivery_id: string;
  pickup_address: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  dropoff_address: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  pickup_business_name: string;
  pickup_phone_number?: string;
  dropoff_business_name?: string;
  dropoff_phone_number?: string;
  dropoff_instructions?: string;
}

export interface DoorDashQuoteResponse {
  quote_id: string;
  external_delivery_id: string;
  expires_at: string;
  fee: number;
  currency: string;
}

// US address components as required by DoorDash API
export interface DropoffAddressComponentsUS {
  street_address: string; // Street address (concatenated multiple lines)
  sub_premise?: string; // Unit/apartment/suite number
  city: string; // City for the address
  state: string; // 2-letter state code (e.g., "CA" for California)
  zip_code: string; // 5-digit zip code
  country: string; // ISO 3166 Alpha 2 code (e.g., "US")
}

export interface DoorDashDeliveryRequest extends DoorDashQuoteRequest {
  items: Array<{
    name: string;
    quantity: number;
    description?: string;
    price?: number; // Unit price in cents
  }>;
  // Timing fields (ISO-8601 format in UTC)
  pickup_time?: string;
  dropoff_time?: string;
  pickup_window?: {
    start_time: string;
    end_time: string;
  };
  dropoff_window?: {
    start_time: string;
    end_time: string;
  };
  
  // Contact information
  pickup_contact_given_name?: string; // First name of pickup contact (Required by DoorDash)
  pickup_contact_family_name?: string; // Last name of pickup contact
  dropoff_contact_given_name?: string; // First name of dropoff contact (Required by DoorDash)
  dropoff_contact_family_name?: string; // Last name of dropoff contact
  
  // SMS notifications
  dropoff_contact_send_notifications?: boolean; // Whether to send SMS notifications to customer
  
  // Address components for accurate delivery (required by DoorDash)
  dropoff_address_components?: DropoffAddressComponentsUS;
  
  // Support for restricted items
  order_contains?: {
    alcohol?: boolean;
    pharmacy_items?: boolean;
    age_restricted_pharmacy_items?: boolean;
    tobacco?: boolean;
    hemp?: boolean;
    otc?: boolean;
  };
  
  // Support for large orders
  is_catering_order?: boolean;
  
  // Support for contactless delivery
  contactless_dropoff?: boolean;
  
  // Tipping
  tip?: number; // Tip amount in cents
  
  // Order value
  order_value?: number; // Order subtotal in cents
}

export interface DoorDashDeliveryResponse {
  external_delivery_id: string;
  delivery_status: string;
  tracking_url?: string;
  fee: number;
  currency: string;
}

export interface DoorDashWebhookPayload {
  event_type: string;
  delivery_id: string;
  external_delivery_id: string;
  status?: string;
  [key: string]: any;
}

// Helper function to format address for SDK
function formatAddress(address: DoorDashQuoteRequest['pickup_address']): string {
  return `${address.street}, ${address.city}, ${address.state}, ${address.zip_code}, ${address.country}`;
}

/**
 * Gets delivery quote from DoorDash Drive
 */
export async function estimate(quoteRequest: DoorDashQuoteRequest): Promise<DoorDashQuoteResponse> {
  try {
    // Generate a unique delivery ID if one isn't provided
    const external_delivery_id = quoteRequest.external_delivery_id || uuidv4();

    // Convert the request to SDK format
    const sdkQuoteInput = {
      external_delivery_id,
      pickup_address: formatAddress(quoteRequest.pickup_address),
      dropoff_address: formatAddress(quoteRequest.dropoff_address),
      pickup_business_name: quoteRequest.pickup_business_name,
      pickup_phone_number: quoteRequest.pickup_phone_number || '+15555555555',
      dropoff_business_name: quoteRequest.dropoff_business_name,
      dropoff_phone_number: quoteRequest.dropoff_phone_number || '+15555555555',
      dropoff_instructions: quoteRequest.dropoff_instructions,
    };

    // Call the SDK
    const response = await doorDashSDK.getDeliveryQuote(sdkQuoteInput);
    const data = response.data;

    // Convert SDK response to our format
    // Generate a quote ID based on the external delivery ID
    const quote_id = `quote_${external_delivery_id}`;
    
    // Set expiration 30 minutes from now
    const expires_at = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    // Convert fee from cents to dollars
    const fee = (data.fee || 0) / 100;

    return {
      quote_id,
      external_delivery_id: data.external_delivery_id || external_delivery_id,
      expires_at,
      fee,
      currency: data.currency || 'USD',
    };
  } catch (error) {
    console.error('Error estimating DoorDash delivery:', error);
    throw error;
  }
}

/**
 * Creates a delivery on DoorDash Drive
 */
export async function createDelivery(deliveryRequest: DoorDashDeliveryRequest): Promise<DoorDashDeliveryResponse> {
  try {
    // Format addresses for consistent format
    const formattedPickupAddress = formatAddress(deliveryRequest.pickup_address);
    const formattedDropoffAddress = formatAddress(deliveryRequest.dropoff_address);
    
    // Calculate order value if not provided
    const orderValue = deliveryRequest.order_value || 
      deliveryRequest.items.reduce((sum, item) => {
        // Use item price if available, otherwise default to 1
        const itemPrice = (item.price || 1) * (item.quantity || 1);
        return sum + itemPrice;
      }, 0);

    // Set dropoff options for delivery types like catering
    const dropoff_options: { catering_setup?: string } = {};
    if (deliveryRequest.is_catering_order) {
      dropoff_options.catering_setup = 'required';
    }
    
    // Add the dropoff_options to the SDK input
    const hasDropoffOptions = Object.keys(dropoff_options).length > 0;

    const sdkDeliveryInput: any = {
      external_delivery_id: uuidv4(),
      pickup_address: formattedPickupAddress,
      pickup_business_name: deliveryRequest.pickup_business_name,
      pickup_phone_number: deliveryRequest.pickup_phone_number || '+15555555555',
      pickup_instructions: deliveryRequest.dropoff_instructions,
      dropoff_address: formattedDropoffAddress,
      dropoff_business_name: deliveryRequest.dropoff_business_name,
      dropoff_phone_number: deliveryRequest.dropoff_phone_number || '+15555555555',
      dropoff_instructions: deliveryRequest.dropoff_instructions,
      order_value: orderValue,
      items: deliveryRequest.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        description: item.description,
        price: item.price
      })),
      
      // Time windows
      pickup_time: deliveryRequest.pickup_time,
      dropoff_time: deliveryRequest.dropoff_time,
      pickup_window: deliveryRequest.pickup_window,
      dropoff_window: deliveryRequest.dropoff_window,
      
      // Contact information
      pickup_contact_given_name: deliveryRequest.pickup_contact_given_name || deliveryRequest.pickup_business_name,
      pickup_contact_family_name: deliveryRequest.pickup_contact_family_name,
      dropoff_contact_given_name: deliveryRequest.dropoff_contact_given_name || deliveryRequest.dropoff_business_name,
      dropoff_contact_family_name: deliveryRequest.dropoff_contact_family_name,
      
      // SMS notifications (enabled by default as recommended by DoorDash)
      dropoff_contact_send_notifications: deliveryRequest.dropoff_contact_send_notifications !== false,
      
      // Dropoff address components
      dropoff_address_components: deliveryRequest.dropoff_address_components,
      
      // Restricted item flags
      order_contains: deliveryRequest.order_contains,
      
      // Tip amount
      tip: deliveryRequest.tip,
      
      // Delivery options
      contactless_dropoff: deliveryRequest.contactless_dropoff,
      dropoff_options: hasDropoffOptions ? dropoff_options : undefined
    };

    // Call the SDK
    const response = await doorDashSDK.createDelivery(sdkDeliveryInput);
    const data = response.data;

    // Convert SDK response to our format
    // Extract delivery status safely from the response data
    const deliveryStatus = (typeof data === 'object' && data !== null && 'status' in data) 
      ? String(data.status) 
      : 'unknown';
    
    // Convert fee from cents to dollars
    const fee = (data.fee || 0) / 100;

    return {
      external_delivery_id: data.external_delivery_id,
      delivery_status: deliveryStatus,
      tracking_url: data.tracking_url,
      fee,
      currency: data.currency || 'USD',
    };
  } catch (error) {
    console.error('Error creating DoorDash delivery:', error);
    throw error;
  }
}

/**
 * Gets delivery status from DoorDash Drive
 */
export async function getDeliveryStatus(externalDeliveryId: string): Promise<DoorDashDeliveryResponse> {
  try {
    // Call the SDK
    const response = await doorDashSDK.getDeliveryStatus(externalDeliveryId);
    const data = response.data;

    // Convert SDK response to our format
    // Extract delivery status safely from the response data
    const deliveryStatus = (typeof data === 'object' && data !== null && 'status' in data) 
      ? String(data.status) 
      : 'unknown';
    
    // Convert fee from cents to dollars
    const fee = (data.fee || 0) / 100;

    return {
      external_delivery_id: data.external_delivery_id,
      delivery_status: deliveryStatus,
      tracking_url: data.tracking_url,
      fee,
      currency: data.currency || 'USD',
    };
  } catch (error) {
    console.error('Error getting DoorDash delivery status:', error);
    throw error;
  }
}

/**
 * Cancel a delivery on DoorDash
 */
export async function cancelDelivery(externalDeliveryId: string): Promise<DoorDashDeliveryResponse> {
  try {
    // Call the SDK
    const response = await doorDashSDK.cancelDelivery(externalDeliveryId);
    const data = response.data;

    // Convert SDK response to our format
    // Extract delivery status safely from the response data
    const deliveryStatus = (typeof data === 'object' && data !== null && 'status' in data) 
      ? String(data.status) 
      : 'cancelled';
    
    // Convert fee from cents to dollars
    const fee = (data.fee || 0) / 100;

    return {
      external_delivery_id: data.external_delivery_id,
      delivery_status: deliveryStatus,
      tracking_url: data.tracking_url,
      fee,
      currency: data.currency || 'USD',
    };
  } catch (error) {
    console.error(`Error cancelling DoorDash delivery ${externalDeliveryId}:`, error);
    throw error;
  }
}

/**
 * Parse and validate a DoorDash webhook payload
 */
export async function parseWebhook(
  signature: string,
  timestamp: string,
  rawBody: string
): Promise<{ isValid: boolean; payload?: DoorDashWebhookPayload }> {
  try {
    // Verify the webhook signature
    const isValid = verifyWebhookSignature(signature, timestamp, rawBody);

    if (!isValid) {
      return { isValid: false };
    }

    // Parse the payload
    const payload = JSON.parse(rawBody);

    return {
      isValid: true,
      payload: {
        event_type: payload.event_type,
        delivery_id: payload.delivery_id,
        external_delivery_id: payload.external_delivery_id,
        status: payload.status,
        ...payload,
      },
    };
  } catch (error) {
    console.error('Error parsing DoorDash webhook:', error);
    return { isValid: false };
  }
} 