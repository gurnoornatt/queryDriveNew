import { v4 as uuidv4 } from 'uuid';
import { doorDashAPI } from '../services/doordash';

/**
 * DoorDash Drive API client for restaurant operations
 *
 * This client handles interactions with the DoorDash Drive API for restaurant businesses,
 * including business management, store management, and delivery creation from stores.
 */

// Business interfaces
export interface DoorDashBusiness {
  external_business_id: string;
  name: string;
  id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DoorDashStore {
  external_store_id: string;
  external_business_id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    unit?: string;
  };
  phone_number: string;
  business_hours?: BusinessHours[];
  id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BusinessHours {
  day_of_week: string; // "monday", "tuesday", etc.
  open_time: string;   // "08:00"
  close_time: string;  // "20:00"
}

export interface DoorDashStoreDeliveryRequest {
  external_delivery_id: string;
  pickup_external_business_id: string;
  pickup_external_store_id: string;
  dropoff_address: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    unit?: string;
  };
  dropoff_business_name?: string;
  dropoff_phone_number?: string;
  dropoff_instructions?: string;
  items: Array<{
    name: string;
    quantity: number;
    description?: string;
    price?: number; // Unit price in cents
  }>;
  order_value?: number; // Order subtotal in cents
  dropoff_contact_given_name?: string;
  dropoff_contact_family_name?: string;
  dropoff_contact_send_notifications?: boolean;
  is_catering_order?: boolean;
  contactless_dropoff?: boolean;
}

export interface DoorDashDeliveryResponse {
  external_delivery_id: string;
  delivery_status: string;
  tracking_url?: string;
  fee: number;
  currency: string;
}

/**
 * Creates a business in DoorDash
 * 
 * @param business - Business details
 * @returns Business details including DoorDash ID
 */
export const createBusiness = async (
  business: DoorDashBusiness
): Promise<DoorDashBusiness> => {
  try {
    // Generate a unique business ID if one isn't provided
    const external_business_id = business.external_business_id || `business-${uuidv4()}`;

    // Create the API request
    const apiRequest = {
      external_business_id,
      name: business.name,
    };

    // Call the DoorDash API
    const response = await doorDashAPI.createBusiness(apiRequest);

    // Return the created business
    return {
      external_business_id: response.external_business_id,
      name: response.name,
      id: response.id,
      created_at: response.created_at,
      updated_at: response.updated_at,
    };
  } catch (error) {
    console.error('Error creating DoorDash business:', error);
    throw error;
  }
};

/**
 * Gets a business from DoorDash
 * 
 * @param externalBusinessId - The external business ID
 * @returns Business details
 */
export const getBusiness = async (
  externalBusinessId: string
): Promise<DoorDashBusiness> => {
  try {
    // Call the DoorDash API
    const response = await doorDashAPI.getBusiness(externalBusinessId);

    // Return the business
    return {
      external_business_id: response.external_business_id,
      name: response.name,
      id: response.id,
      created_at: response.created_at,
      updated_at: response.updated_at,
    };
  } catch (error) {
    console.error('Error getting DoorDash business:', error);
    throw error;
  }
};

/**
 * Lists all businesses in DoorDash
 * 
 * @param limit - Maximum number of businesses to return
 * @param offset - Starting offset for pagination
 * @returns List of businesses
 */
export const listBusinesses = async (
  limit?: number,
  offset?: number
): Promise<DoorDashBusiness[]> => {
  try {
    // Create the API request
    const apiRequest = {
      limit,
      offset,
    };

    // Call the DoorDash API
    const response = await doorDashAPI.listBusinesses(apiRequest);

    // Return the businesses
    return response.businesses.map((business: any) => ({
      external_business_id: business.external_business_id,
      name: business.name,
      id: business.id,
      created_at: business.created_at,
      updated_at: business.updated_at,
    }));
  } catch (error) {
    console.error('Error listing DoorDash businesses:', error);
    throw error;
  }
};

/**
 * Updates a business in DoorDash
 * 
 * @param business - Business details to update
 * @returns Updated business details
 */
export const updateBusiness = async (
  business: DoorDashBusiness
): Promise<DoorDashBusiness> => {
  try {
    // Create the API request
    const apiRequest = {
      external_business_id: business.external_business_id,
      name: business.name,
    };

    // Call the DoorDash API
    const response = await doorDashAPI.updateBusiness(apiRequest);

    // Return the updated business
    return {
      external_business_id: response.external_business_id,
      name: response.name,
      id: response.id,
      created_at: response.created_at,
      updated_at: response.updated_at,
    };
  } catch (error) {
    console.error('Error updating DoorDash business:', error);
    throw error;
  }
};

/**
 * Creates a store for a business in DoorDash
 * 
 * @param store - Store details
 * @returns Store details including DoorDash ID
 */
export const createStore = async (
  store: DoorDashStore
): Promise<DoorDashStore> => {
  try {
    // Generate a unique store ID if one isn't provided
    const external_store_id = store.external_store_id || `store-${uuidv4()}`;

    // Create the API request
    const apiRequest = {
      external_store_id,
      external_business_id: store.external_business_id,
      name: store.name,
      address: store.address,
      phone_number: store.phone_number,
      business_hours: store.business_hours,
    };

    // Call the DoorDash API
    const response = await doorDashAPI.createStore(apiRequest);

    // Return the created store
    return {
      external_store_id: response.external_store_id,
      external_business_id: response.external_business_id,
      name: response.name,
      address: response.address,
      phone_number: response.phone_number,
      business_hours: response.business_hours,
      id: response.id,
      created_at: response.created_at,
      updated_at: response.updated_at,
    };
  } catch (error) {
    console.error('Error creating DoorDash store:', error);
    throw error;
  }
};

/**
 * Gets a store from DoorDash
 * 
 * @param externalBusinessId - The external business ID
 * @param externalStoreId - The external store ID
 * @returns Store details
 */
export const getStore = async (
  externalBusinessId: string,
  externalStoreId: string
): Promise<DoorDashStore> => {
  try {
    // Call the DoorDash API
    const response = await doorDashAPI.getStore(externalBusinessId, externalStoreId);

    // Return the store
    return {
      external_store_id: response.external_store_id,
      external_business_id: response.external_business_id,
      name: response.name,
      address: response.address,
      phone_number: response.phone_number,
      business_hours: response.business_hours,
      id: response.id,
      created_at: response.created_at,
      updated_at: response.updated_at,
    };
  } catch (error) {
    console.error('Error getting DoorDash store:', error);
    throw error;
  }
};

/**
 * Lists all stores for a business in DoorDash
 * 
 * @param externalBusinessId - The external business ID
 * @param limit - Maximum number of stores to return
 * @param offset - Starting offset for pagination
 * @returns List of stores
 */
export const listStores = async (
  externalBusinessId: string,
  limit?: number,
  offset?: number
): Promise<DoorDashStore[]> => {
  try {
    // Create the API request
    const apiRequest = {
      external_business_id: externalBusinessId,
      limit,
      offset,
    };

    // Call the DoorDash API
    const response = await doorDashAPI.listStores(apiRequest);

    // Return the stores
    return response.stores.map((store: any) => ({
      external_store_id: store.external_store_id,
      external_business_id: store.external_business_id,
      name: store.name,
      address: store.address,
      phone_number: store.phone_number,
      business_hours: store.business_hours,
      id: store.id,
      created_at: store.created_at,
      updated_at: store.updated_at,
    }));
  } catch (error) {
    console.error('Error listing DoorDash stores:', error);
    throw error;
  }
};

/**
 * Updates a store in DoorDash
 * 
 * @param store - Store details to update
 * @returns Updated store details
 */
export const updateStore = async (
  store: DoorDashStore
): Promise<DoorDashStore> => {
  try {
    // Create the API request
    const apiRequest = {
      external_store_id: store.external_store_id,
      external_business_id: store.external_business_id,
      name: store.name,
      address: store.address,
      phone_number: store.phone_number,
      business_hours: store.business_hours,
    };

    // Call the DoorDash API
    const response = await doorDashAPI.updateStore(apiRequest);

    // Return the updated store
    return {
      external_store_id: response.external_store_id,
      external_business_id: response.external_business_id,
      name: response.name,
      address: response.address,
      phone_number: response.phone_number,
      business_hours: response.business_hours,
      id: response.id,
      created_at: response.created_at,
      updated_at: response.updated_at,
    };
  } catch (error) {
    console.error('Error updating DoorDash store:', error);
    throw error;
  }
};

/**
 * Creates a delivery from a store in DoorDash
 * 
 * @param deliveryRequest - Delivery details
 * @returns Delivery response
 */
export const createDeliveryFromStore = async (
  deliveryRequest: DoorDashStoreDeliveryRequest
): Promise<DoorDashDeliveryResponse> => {
  try {
    // Generate a unique delivery ID if one isn't provided
    const external_delivery_id = deliveryRequest.external_delivery_id || `delivery-${Date.now()}-${uuidv4().slice(0, 8)}`;
    
    // Calculate order value if not provided
    const orderValue = deliveryRequest.order_value || 
      deliveryRequest.items.reduce((sum, item) => {
        // Use item price if available, otherwise default to 100 (1 dollar in cents)
        const itemPrice = (item.price || 100) * (item.quantity || 1);
        return sum + itemPrice;
      }, 0);
    
    // Format the dropoff address
    let formattedDropoffAddress = `${deliveryRequest.dropoff_address.street}, ${deliveryRequest.dropoff_address.city}, ${deliveryRequest.dropoff_address.state}, ${deliveryRequest.dropoff_address.zip_code}, ${deliveryRequest.dropoff_address.country}`;
    if (deliveryRequest.dropoff_address.unit) {
      formattedDropoffAddress += ` Unit ${deliveryRequest.dropoff_address.unit}`;
    }

    // Set dropoff options for delivery types like catering
    const dropoff_options: any = {};
    if (deliveryRequest.is_catering_order) {
      dropoff_options.catering_setup = 'required';
    }
    
    // Create delivery input
    const apiDeliveryInput: any = {
      external_delivery_id,
      pickup_external_business_id: deliveryRequest.pickup_external_business_id,
      pickup_external_store_id: deliveryRequest.pickup_external_store_id,
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
      
      // Contact information
      dropoff_contact_given_name: deliveryRequest.dropoff_contact_given_name || deliveryRequest.dropoff_business_name || 'Customer',
      dropoff_contact_family_name: deliveryRequest.dropoff_contact_family_name || '',
      
      // SMS notifications (enabled by default as recommended by DoorDash)
      dropoff_contact_send_notifications: deliveryRequest.dropoff_contact_send_notifications !== false,
      
      // Delivery options
      contactless_dropoff: deliveryRequest.contactless_dropoff
    };
    
    // Add dropoff options if any are set
    if (Object.keys(dropoff_options).length > 0) {
      apiDeliveryInput.dropoff_options = dropoff_options;
    }

    // Call the DoorDash API to create the delivery
    const response = await doorDashAPI.createDelivery(apiDeliveryInput);

    // Return the delivery response
    return {
      external_delivery_id: response.external_delivery_id || external_delivery_id,
      delivery_status: response.status || 'created',
      tracking_url: response.tracking_url || '',
      fee: response.fee || 0,
      currency: response.currency || 'USD',
    };
  } catch (error) {
    console.error('Error creating DoorDash delivery from store:', error);
    throw error;
  }
}; 