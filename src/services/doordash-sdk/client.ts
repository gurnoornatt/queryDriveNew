import { DoorDashClient, CreateDeliveryInput, DeliveryQuoteInput, UpdateDeliveryInput, DeliveryResponse, DoorDashResponse } from '@doordash/sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get DoorDash credentials from environment variables
const DD_DEVELOPER_ID = process.env.DD_DEVELOPER_ID;
const DD_KEY_ID = process.env.DD_KEY_ID;
const DD_SIGNING_SECRET = process.env.DD_SIGNING_SECRET;

// Check if credentials are available
if (!DD_DEVELOPER_ID || !DD_KEY_ID || !DD_SIGNING_SECRET) {
  console.error(
    'Missing DoorDash API credentials. Make sure DD_DEVELOPER_ID, DD_KEY_ID, and DD_SIGNING_SECRET are set in the .env file.'
  );
}

/**
 * DoorDash SDK client singleton for interacting with the DoorDash Drive API
 */
class DoorDashSDKClient {
  private client: DoorDashClient;
  private static instance: DoorDashSDKClient;

  private constructor() {
    this.client = new DoorDashClient({
      developer_id: DD_DEVELOPER_ID || '',
      key_id: DD_KEY_ID || '',
      signing_secret: DD_SIGNING_SECRET || '',
    });
  }

  /**
   * Get the singleton instance of the DoorDash SDK client
   * @returns The DoorDash SDK client instance
   */
  public static getInstance(): DoorDashSDKClient {
    if (!DoorDashSDKClient.instance) {
      DoorDashSDKClient.instance = new DoorDashSDKClient();
    }
    return DoorDashSDKClient.instance;
  }

  /**
   * Get a quote for a delivery
   * @param quoteInput The delivery quote request details
   * @returns Promise with the delivery quote response
   */
  public async getDeliveryQuote(quoteInput: DeliveryQuoteInput): Promise<DoorDashResponse<DeliveryResponse>> {
    try {
      return await this.client.deliveryQuote(quoteInput);
    } catch (error) {
      console.error('Error getting DoorDash delivery quote:', error);
      throw error;
    }
  }

  /**
   * Create a delivery
   * @param deliveryInput The delivery request details
   * @returns Promise with the delivery response
   */
  public async createDelivery(deliveryInput: CreateDeliveryInput): Promise<DoorDashResponse<DeliveryResponse>> {
    try {
      return await this.client.createDelivery(deliveryInput);
    } catch (error) {
      console.error('Error creating DoorDash delivery:', error);
      throw error;
    }
  }

  /**
   * Get delivery status
   * @param externalDeliveryId The external delivery ID
   * @returns Promise with the delivery status response
   */
  public async getDeliveryStatus(externalDeliveryId: string): Promise<DoorDashResponse<DeliveryResponse>> {
    try {
      return await this.client.getDelivery(externalDeliveryId);
    } catch (error) {
      console.error(`Error getting DoorDash delivery status for ${externalDeliveryId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel a delivery
   * @param externalDeliveryId The external delivery ID
   * @returns Promise with the cancel response
   */
  public async cancelDelivery(externalDeliveryId: string): Promise<DoorDashResponse<DeliveryResponse>> {
    try {
      return await this.client.cancelDelivery(externalDeliveryId);
    } catch (error) {
      console.error(`Error cancelling DoorDash delivery ${externalDeliveryId}:`, error);
      throw error;
    }
  }

  /**
   * Update a delivery
   * @param externalDeliveryId The external delivery ID
   * @param updateInput The update request details
   * @returns Promise with the update response
   */
  public async updateDelivery(
    externalDeliveryId: string,
    updateInput: UpdateDeliveryInput
  ): Promise<DoorDashResponse<DeliveryResponse>> {
    try {
      return await this.client.updateDelivery(externalDeliveryId, updateInput);
    } catch (error) {
      console.error(`Error updating DoorDash delivery ${externalDeliveryId}:`, error);
      throw error;
    }
  }
}

// Export the singleton instance
export const doorDashSDK = DoorDashSDKClient.getInstance(); 