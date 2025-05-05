import { describe, expect, it, vi, beforeEach } from 'vitest';
import { DoorDashAPI } from '../api';
import { DoorDashClient } from '../client';

// Mock the DoorDashClient
vi.mock('../client', () => {
  return {
    DoorDashClient: vi.fn().mockImplementation(() => ({
      post: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    }))
  };
});

describe('DoorDashAPI', () => {
  let api: DoorDashAPI;
  let mockClient: any; // Using any to avoid TypeScript errors with mocks

  beforeEach(() => {
    // Clear mocks between tests
    vi.clearAllMocks();
    
    // Create a new API instance for each test
    api = new DoorDashAPI();
    
    // Access the mocked client instance
    mockClient = (DoorDashClient as unknown as ReturnType<typeof vi.fn>).mock.results[0].value;
  });

  it('should initialize with a DoorDashClient instance', () => {
    expect(DoorDashClient).toHaveBeenCalledTimes(1);
    expect(api).toBeDefined();
  });

  describe('getDeliveryQuote', () => {
    it('should call client.post with the correct arguments', async () => {
      // Setup test data
      const quoteRequest = {
        external_delivery_id: 'test-delivery-123',
        pickup_address: {
          street: '123 Pickup St',
          city: 'San Francisco',
          state: 'CA',
          zip_code: '94105',
          country: 'US',
        },
        pickup_business_name: 'Test Restaurant',
        pickup_phone_number: '+11234567890',
        dropoff_address: {
          street: '456 Dropoff St',
          city: 'San Francisco',
          state: 'CA',
          zip_code: '94105',
          country: 'US',
        },
        dropoff_business_name: 'Test Customer',
        dropoff_phone_number: '+10987654321',
      };
      
      // Setup mock response
      const mockResponse = {
        external_delivery_id: 'test-delivery-123',
        delivery_id: 'dd-delivery-123',
        currency: 'USD',
        fee: 7.99,
        duration_seconds: 1800,
      };
      mockClient.post.mockResolvedValue(mockResponse);

      // Call the method
      const result = await api.getDeliveryQuote(quoteRequest);

      // Assert
      expect(mockClient.post).toHaveBeenCalledWith('/quotes', quoteRequest);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createDelivery', () => {
    it('should call client.post with the correct arguments', async () => {
      // Setup test data
      const deliveryRequest = {
        external_delivery_id: 'test-delivery-123',
        pickup_address: {
          street: '123 Pickup St',
          city: 'San Francisco',
          state: 'CA',
          zip_code: '94105',
          country: 'US',
        },
        pickup_business_name: 'Test Restaurant',
        pickup_phone_number: '+11234567890',
        dropoff_address: {
          street: '456 Dropoff St',
          city: 'San Francisco',
          state: 'CA',
          zip_code: '94105',
          country: 'US',
        },
        dropoff_business_name: 'Test Customer',
        dropoff_phone_number: '+10987654321',
        order_value: 25.99,
        // Add required contact fields
        pickup_contact: {
          first_name: 'Test',
          phone_number: '+11234567890',
        },
        dropoff_contact: {
          first_name: 'Test',
          phone_number: '+10987654321',
        },
      };
      
      // Setup mock response
      const mockResponse = {
        external_delivery_id: 'test-delivery-123',
        delivery_id: 'dd-delivery-123',
        status: 'accepted',
        tracking_url: 'https://doordash.com/tracking/dd-delivery-123',
        support_reference: 'DD-123-456-7890',
        currency: 'USD',
        fee: 7.99,
        pickup: {
          // pickup details
        },
        dropoff: {
          // dropoff details
        },
        created_at: '2023-05-01T09:00:00Z',
        updated_at: '2023-05-01T10:00:00Z',
      };
      mockClient.post.mockResolvedValue(mockResponse);

      // Call the method
      const result = await api.createDelivery(deliveryRequest);

      // Assert
      expect(mockClient.post).toHaveBeenCalledWith('/deliveries', deliveryRequest);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getDeliveryStatus', () => {
    it('should call client.get with the correct arguments', async () => {
      // Setup test data
      const deliveryId = 'test-delivery-123';
      
      // Setup mock response
      const mockResponse = {
        external_delivery_id: 'test-delivery-123',
        delivery_id: 'dd-delivery-123',
        status: 'in_progress',
        tracking_url: 'https://doordash.com/tracking/dd-delivery-123',
        support_reference: 'DD-123-456-7890',
        currency: 'USD',
        fee: 7.99,
        pickup: {
          // pickup details
        },
        dropoff: {
          // dropoff details
        },
      };
      mockClient.get.mockResolvedValue(mockResponse);

      // Call the method
      const result = await api.getDeliveryStatus(deliveryId);

      // Assert
      expect(mockClient.get).toHaveBeenCalledWith(`/deliveries/${deliveryId}`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('cancelDelivery', () => {
    it('should call client.put with the correct arguments', async () => {
      // Setup test data
      const deliveryId = 'test-delivery-123';
      const cancelRequest = { reason: 'Customer requested cancellation' };
      
      // Setup mock response
      const mockResponse = {
        external_delivery_id: 'test-delivery-123',
        delivery_id: 'dd-delivery-123',
        status: 'canceled',
        canceled_at: '2023-05-01T10:30:00Z',
      };
      mockClient.put.mockResolvedValue(mockResponse);

      // Call the method
      const result = await api.cancelDelivery(deliveryId, cancelRequest);

      // Assert
      expect(mockClient.put).toHaveBeenCalledWith(`/deliveries/${deliveryId}/cancel`, cancelRequest);
      expect(result).toEqual(mockResponse);
    });
  });
}); 