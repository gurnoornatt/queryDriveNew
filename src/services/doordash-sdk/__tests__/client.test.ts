import { describe, it, expect, vi, beforeEach } from 'vitest';
import { doorDashSDK } from '../client';
import { DoorDashClient } from '@doordash/sdk';

// Mock the DoorDash SDK
vi.mock('@doordash/sdk', () => {
  return {
    DoorDashClient: vi.fn().mockImplementation(() => ({
      deliveryQuote: vi.fn(),
      createDelivery: vi.fn(),
      getDelivery: vi.fn(),
      cancelDelivery: vi.fn(),
      updateDelivery: vi.fn()
    }))
  };
});

describe('DoorDashSDKClient', () => {
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Access the client property of the singleton instance
    mockClient = (doorDashSDK as any).client;
  });

  describe('getDeliveryQuote', () => {
    it('should call SDK deliveryQuote with correct parameters', async () => {
      // Setup test data with all required fields
      const quoteInput = {
        external_delivery_id: 'test-id-123',
        pickup_address: '123 Pickup St, San Francisco, CA, 94105, US',
        dropoff_address: '456 Dropoff Ave, San Francisco, CA, 94105, US',
        pickup_business_name: 'Test Restaurant',
        pickup_phone_number: '+15555555555',
        dropoff_phone_number: '+15551234567', // Required field
        dropoff_business_name: 'Test Customer',
        dropoff_instructions: 'Leave at door'
      };
      
      // Mock response
      const mockResponse = {
        data: {
          external_delivery_id: 'test-id-123',
          fee: 995,
          currency: 'USD'
        }
      };
      mockClient.deliveryQuote.mockResolvedValue(mockResponse);

      // Execute
      const result = await doorDashSDK.getDeliveryQuote(quoteInput);

      // Verify
      expect(mockClient.deliveryQuote).toHaveBeenCalledWith(quoteInput);
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors correctly', async () => {
      // Setup test data with all required fields
      const quoteInput = {
        external_delivery_id: 'test-id-123',
        pickup_address: '123 Pickup St, San Francisco, CA, 94105, US',
        dropoff_address: '456 Dropoff Ave, San Francisco, CA, 94105, US',
        pickup_business_name: 'Test Restaurant',
        pickup_phone_number: '+15555555555',
        dropoff_phone_number: '+15551234567', // Required field
        dropoff_business_name: 'Test Customer'
      };
      
      // Mock error
      const mockError = new Error('API Error');
      mockClient.deliveryQuote.mockRejectedValue(mockError);
      
      // Mock console.error
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Execute and verify
      await expect(doorDashSDK.getDeliveryQuote(quoteInput)).rejects.toThrow('API Error');
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });

  describe('createDelivery', () => {
    it('should call SDK createDelivery with correct parameters', async () => {
      // Setup test data with all required fields
      const deliveryInput = {
        external_delivery_id: 'test-id-123',
        pickup_address: '123 Pickup St, San Francisco, CA, 94105, US',
        dropoff_address: '456 Dropoff Ave, San Francisco, CA, 94105, US',
        pickup_business_name: 'Test Restaurant',
        pickup_phone_number: '+15555555555',
        dropoff_phone_number: '+15551234567', // Required field
        dropoff_business_name: 'Test Customer',
        items: [{ name: 'Test Item', quantity: 1 }],
        order_value: 1000 // In cents (equivalent to $10.00)
      };
      
      // Mock response
      const mockResponse = {
        data: {
          external_delivery_id: 'test-id-123',
          status: 'created',
          fee: 995,
          currency: 'USD',
          tracking_url: 'https://track.doordash.com/order/123'
        }
      };
      mockClient.createDelivery.mockResolvedValue(mockResponse);

      // Execute
      const result = await doorDashSDK.createDelivery(deliveryInput);

      // Verify
      expect(mockClient.createDelivery).toHaveBeenCalledWith(deliveryInput);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getDeliveryStatus', () => {
    it('should call SDK getDelivery with correct ID', async () => {
      // Setup test data
      const externalDeliveryId = 'test-id-123';
      
      // Mock response
      const mockResponse = {
        data: {
          external_delivery_id: 'test-id-123',
          status: 'delivered',
          fee: 995,
          currency: 'USD'
        }
      };
      mockClient.getDelivery.mockResolvedValue(mockResponse);

      // Execute
      const result = await doorDashSDK.getDeliveryStatus(externalDeliveryId);

      // Verify
      expect(mockClient.getDelivery).toHaveBeenCalledWith(externalDeliveryId);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('cancelDelivery', () => {
    it('should call SDK cancelDelivery with correct ID', async () => {
      // Setup test data
      const externalDeliveryId = 'test-id-123';
      
      // Mock response
      const mockResponse = {
        data: {
          external_delivery_id: 'test-id-123',
          status: 'canceled'
        }
      };
      mockClient.cancelDelivery.mockResolvedValue(mockResponse);

      // Execute
      const result = await doorDashSDK.cancelDelivery(externalDeliveryId);

      // Verify
      expect(mockClient.cancelDelivery).toHaveBeenCalledWith(externalDeliveryId);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateDelivery', () => {
    it('should call SDK updateDelivery with correct parameters', async () => {
      // Setup test data
      const externalDeliveryId = 'test-id-123';
      const updateInput = {
        dropoff_instructions: 'Leave at the door'
      };
      
      // Mock response
      const mockResponse = {
        data: {
          external_delivery_id: 'test-id-123',
          status: 'updated'
        }
      };
      mockClient.updateDelivery.mockResolvedValue(mockResponse);

      // Execute
      const result = await doorDashSDK.updateDelivery(externalDeliveryId, updateInput);

      // Verify
      expect(mockClient.updateDelivery).toHaveBeenCalledWith(externalDeliveryId, updateInput);
      expect(result).toEqual(mockResponse);
    });
  });
}); 