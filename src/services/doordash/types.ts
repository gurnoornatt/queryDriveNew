/**
 * Base address interface for pickup and dropoff locations
 */
export interface Address {
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  unit?: string;
  business_name?: string;
  instructions?: string;
}

/**
 * Contact information interface for pickup and dropoff contacts
 */
export interface Contact {
  first_name: string;
  last_name?: string;
  phone_number: string;
  email?: string;
}

/**
 * Item details for delivery
 */
export interface DeliveryItem {
  name: string;
  quantity: number;
  description?: string;
  price?: number;
  weight?: {
    unit: 'kg' | 'lb';
    value: number;
  };
  dimensions?: {
    unit: 'cm' | 'in';
    length: number;
    width: number;
    height: number;
  };
}

/**
 * Delivery quote request interface
 */
export interface DeliveryQuoteRequest {
  external_delivery_id?: string;
  pickup_address: Address;
  pickup_phone_number?: string;
  pickup_business_name?: string;
  pickup_instructions?: string;
  dropoff_address: Address;
  dropoff_phone_number?: string;
  dropoff_business_name?: string;
  dropoff_instructions?: string;
  order_value?: number;
  items?: DeliveryItem[];
}

/**
 * Delivery quote response interface
 */
export interface DeliveryQuoteResponse {
  quote_id: string;
  external_delivery_id?: string;
  currency: string;
  fee: number;
  fee_components: {
    type: string;
    amount: number;
  }[];
  expires_at: string;
  duration_seconds: number;
  pickup_time?: string;
  dropoff_time?: string;
}

/**
 * Delivery request interface extending quote request with additional fields
 */
export interface DeliveryRequest extends DeliveryQuoteRequest {
  quote_id?: string;
  pickup_time?: string;
  dropoff_time?: string;
  pickup_contact: Contact;
  dropoff_contact: Contact;
  contactless_dropoff?: boolean;
  signature_required?: boolean;
  tip?: number;
  allow_unattended_delivery?: boolean;
}

/**
 * Delivery response interface
 */
export interface DeliveryResponse {
  id: string;
  external_delivery_id?: string;
  status: string;
  currency: string;
  fee: number;
  fee_components: {
    type: string;
    amount: number;
  }[];
  tracking_url: string;
  support_reference: string;
  pickup_time?: string;
  dropoff_time?: string;
  estimated_pickup_time?: string;
  estimated_dropoff_time?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Delivery status interface with current status and location
 */
export interface DeliveryStatus extends DeliveryResponse {
  pickup: {
    status: string;
    time?: string;
    verification_code?: string;
  };
  dropoff: {
    status: string;
    time?: string;
    verification_code?: string;
    proof_of_delivery?: {
      url: string;
      type: string;
    };
    signature?: {
      url: string;
      type: string;
    };
  };
  dasher?: {
    first_name: string;
    phone_number: string;
    location?: {
      lat: number;
      lng: number;
      heading?: number;
      last_updated_at: string;
    };
  };
  timeline: {
    created_at: string;
    picked_up_at?: string;
    delivered_at?: string;
    canceled_at?: string;
    returned_at?: string;
    events: {
      type: string;
      status: string;
      time: string;
    }[];
  };
}

/**
 * Delivery cancel request interface
 */
export interface DeliveryCancelRequest {
  reason: string;
}

/**
 * Delivery cancel response interface
 */
export interface DeliveryCancelResponse {
  id: string;
  external_delivery_id?: string;
  status: 'canceled';
  cancel_reason: string;
  created_at: string;
  updated_at: string;
  canceled_at: string;
}

/**
 * Business entity interface for DoorDash integration
 */
export interface Business {
  id: string;
  external_business_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

/**
 * Store entity interface for DoorDash integration
 */
export interface Store {
  id: string;
  external_store_id: string;
  external_business_id: string;
  name: string;
  address: Address;
  phone_number: string;
  business_hours: BusinessHours[];
  created_at: string;
  updated_at: string;
}

/**
 * Business hours for a store
 */
export interface BusinessHours {
  day_of_week: string;
  open_time: string;
  close_time: string;
}

/**
 * Request to create a business
 */
export interface CreateBusinessRequest {
  external_business_id: string;
  name: string;
}

/**
 * Response from creating a business
 */
export interface CreateBusinessResponse extends Business {}

/**
 * Request to get a business
 */
export interface GetBusinessRequest {
  external_business_id: string;
}

/**
 * Request to update a business
 */
export interface UpdateBusinessRequest {
  external_business_id: string;
  name?: string;
}

/**
 * Response from updating a business
 */
export interface UpdateBusinessResponse extends Business {}

/**
 * Request to list businesses
 */
export interface ListBusinessesRequest {
  limit?: number;
  offset?: number;
}

/**
 * Response from listing businesses
 */
export interface ListBusinessesResponse {
  businesses: Business[];
  count: number;
  offset: number;
  limit: number;
}

/**
 * Request to create a store
 */
export interface CreateStoreRequest {
  external_store_id: string;
  external_business_id: string;
  name: string;
  address: Address;
  phone_number: string;
  business_hours?: BusinessHours[];
}

/**
 * Response from creating a store
 */
export interface CreateStoreResponse extends Store {}

/**
 * Request to get a store
 */
export interface GetStoreRequest {
  external_store_id: string;
  external_business_id: string;
}

/**
 * Request to update a store
 */
export interface UpdateStoreRequest {
  external_store_id: string;
  external_business_id: string;
  name?: string;
  address?: Address;
  phone_number?: string;
  business_hours?: BusinessHours[];
}

/**
 * Response from updating a store
 */
export interface UpdateStoreResponse extends Store {}

/**
 * Request to list stores for a business
 */
export interface ListStoresRequest {
  external_business_id: string;
  limit?: number;
  offset?: number;
}

/**
 * Response from listing stores
 */
export interface ListStoresResponse {
  stores: Store[];
  count: number;
  offset: number;
  limit: number;
} 