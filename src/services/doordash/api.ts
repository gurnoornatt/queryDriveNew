import { DoorDashClient } from './client';
import {
  DeliveryQuoteRequest,
  DeliveryQuoteResponse,
  DeliveryRequest,
  DeliveryResponse,
  DeliveryStatus,
  DeliveryCancelRequest,
  DeliveryCancelResponse,
  CreateBusinessRequest,
  CreateBusinessResponse,
  GetBusinessRequest,
  Business,
  UpdateBusinessRequest,
  UpdateBusinessResponse,
  ListBusinessesRequest,
  ListBusinessesResponse,
  CreateStoreRequest,
  CreateStoreResponse,
  GetStoreRequest,
  Store,
  UpdateStoreRequest,
  UpdateStoreResponse,
  ListStoresRequest,
  ListStoresResponse,
} from './types';

/**
 * DoorDash API service for interacting with the DoorDash Drive API
 */
export class DoorDashAPI {
  private client: DoorDashClient;

  constructor() {
    this.client = new DoorDashClient();
  }

  /**
   * Request a delivery quote
   * 
   * @param quoteRequest - Quote request details
   * @returns Promise with quote response
   */
  public async getDeliveryQuote(
    quoteRequest: DeliveryQuoteRequest
  ): Promise<DeliveryQuoteResponse> {
    return this.client.post<DeliveryQuoteResponse>('/quotes', quoteRequest);
  }

  /**
   * Create a delivery
   * 
   * @param deliveryRequest - Delivery request details
   * @returns Promise with delivery response
   */
  public async createDelivery(
    deliveryRequest: DeliveryRequest
  ): Promise<DeliveryResponse> {
    return this.client.post<DeliveryResponse>('/deliveries', deliveryRequest);
  }

  /**
   * Get delivery status by ID
   * 
   * @param deliveryId - The ID of the delivery to get status for
   * @returns Promise with delivery status
   */
  public async getDeliveryStatus(deliveryId: string): Promise<DeliveryStatus> {
    return this.client.get<DeliveryStatus>(`/deliveries/${deliveryId}`);
  }

  /**
   * Cancel a delivery by ID
   * 
   * @param deliveryId - The ID of the delivery to cancel
   * @param cancelRequest - Additional cancellation details
   * @returns Promise with cancellation response
   */
  public async cancelDelivery(
    deliveryId: string,
    cancelRequest: DeliveryCancelRequest
  ): Promise<DeliveryCancelResponse> {
    return this.client.put<DeliveryCancelResponse>(
      `/deliveries/${deliveryId}/cancel`,
      cancelRequest
    );
  }

  // Business APIs

  /**
   * Create a new business
   * 
   * @param businessRequest - Business details to create
   * @returns Promise with business response
   */
  public async createBusiness(
    businessRequest: CreateBusinessRequest
  ): Promise<CreateBusinessResponse> {
    return this.client.post<CreateBusinessResponse>('/businesses', businessRequest);
  }

  /**
   * Get a business by ID
   * 
   * @param externalBusinessId - External ID of the business
   * @returns Promise with business details
   */
  public async getBusiness(
    externalBusinessId: string
  ): Promise<Business> {
    return this.client.get<Business>(`/businesses/${externalBusinessId}`);
  }

  /**
   * Update a business
   * 
   * @param updateRequest - Business update details
   * @returns Promise with updated business
   */
  public async updateBusiness(
    updateRequest: UpdateBusinessRequest
  ): Promise<UpdateBusinessResponse> {
    return this.client.patch<UpdateBusinessResponse>(
      `/businesses/${updateRequest.external_business_id}`,
      updateRequest
    );
  }

  /**
   * List all businesses
   * 
   * @param listRequest - Pagination parameters
   * @returns Promise with list of businesses
   */
  public async listBusinesses(
    listRequest: ListBusinessesRequest = {}
  ): Promise<ListBusinessesResponse> {
    const params = new URLSearchParams();
    if (listRequest.limit) params.append('limit', listRequest.limit.toString());
    if (listRequest.offset) params.append('offset', listRequest.offset.toString());
    
    const queryString = params.toString();
    const url = `/businesses${queryString ? `?${queryString}` : ''}`;
    
    return this.client.get<ListBusinessesResponse>(url);
  }

  // Store APIs

  /**
   * Create a new store for a business
   * 
   * @param storeRequest - Store details to create
   * @returns Promise with store response
   */
  public async createStore(
    storeRequest: CreateStoreRequest
  ): Promise<CreateStoreResponse> {
    return this.client.post<CreateStoreResponse>('/stores', storeRequest);
  }

  /**
   * Get a store by ID
   * 
   * @param externalBusinessId - External ID of the business
   * @param externalStoreId - External ID of the store
   * @returns Promise with store details
   */
  public async getStore(
    externalBusinessId: string,
    externalStoreId: string
  ): Promise<Store> {
    return this.client.get<Store>(
      `/businesses/${externalBusinessId}/stores/${externalStoreId}`
    );
  }

  /**
   * Update a store
   * 
   * @param updateRequest - Store update details
   * @returns Promise with updated store
   */
  public async updateStore(
    updateRequest: UpdateStoreRequest
  ): Promise<UpdateStoreResponse> {
    return this.client.patch<UpdateStoreResponse>(
      `/businesses/${updateRequest.external_business_id}/stores/${updateRequest.external_store_id}`,
      updateRequest
    );
  }

  /**
   * List all stores for a business
   * 
   * @param listRequest - Business ID and pagination parameters
   * @returns Promise with list of stores
   */
  public async listStores(
    listRequest: ListStoresRequest
  ): Promise<ListStoresResponse> {
    const params = new URLSearchParams();
    if (listRequest.limit) params.append('limit', listRequest.limit.toString());
    if (listRequest.offset) params.append('offset', listRequest.offset.toString());
    
    const queryString = params.toString();
    const url = `/businesses/${listRequest.external_business_id}/stores${queryString ? `?${queryString}` : ''}`;
    
    return this.client.get<ListStoresResponse>(url);
  }
}

// Create a singleton instance for easier importing
export const doorDashAPI = new DoorDashAPI(); 