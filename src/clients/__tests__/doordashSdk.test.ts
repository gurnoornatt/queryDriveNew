import { describe, it, expect, vi, beforeEach } from 'vitest';
import { estimate, createDelivery, getDeliveryStatus, parseWebhook } from '../doordashSdk';
import { doorDashSDK } from '../../services/doordash-sdk/client';

// Mock the doorDashSDK
vi.mock('../../services/doordash-sdk/client', () => ({
  doorDashSDK: {
    getDeliveryQuote: vi.fn(),
    createDelivery: vi.fn(),
    getDeliveryStatus: vi.fn(),
  },
}));

// Mock the doorDashAuth module for webhook validation
vi.mock('../../utils/doorDashAuth', () => ({
  verifyWebhookSignature: vi.fn(),
}));

describe('DoorDash SDK Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('estimate', () => {
    it('should convert request and call the SDK correctly', async () => {
      // Setup
      const quoteRequest = {
        external_delivery_id: 'test-delivery-123',
        pickup_address: {
          street: '123 Pickup St',
          city: 'San Francisco',
          state: 'CA',
          zip_code: '94105',
          country: 'US',
        },
        dropoff_address: {
          street: '456 Dropoff St',
          city: 'San Francisco',
          state: 'CA',
          zip_code: '94105',
          country: 'US',
        },
        pickup_business_name: 'Test Restaurant',
      };

      // Mock response
      const mockResponse = {
        data: {
          external_delivery_id: 'test-delivery-123',
          status: 'quote_accepted',
          fee: 995, // in cents
          currency: 'USD',
          tracking_url: 'https://example.com/track/test-delivery-123',
        },
      };

      // Set up the mock
      (doorDashSDK.getDeliveryQuote as any).mockResolvedValue(mockResponse);

      // Execute
      const result = await estimate(quoteRequest);

      // Verify
      expect(doorDashSDK.getDeliveryQuote).toHaveBeenCalledWith(expect.objectContaining({
        external_delivery_id: 'test-delivery-123',
        pickup_address: expect.stringContaining('123 Pickup St, San Francisco, CA, 94105, US'),
        dropoff_address: expect.stringContaining('456 Dropoff St, San Francisco, CA, 94105, US'),
      }));

      // Check result transformation
      expect(result).toEqual(expect.objectContaining({
        external_delivery_id: 'test-delivery-123',
        fee: 9.95, // converted to dollars
        currency: 'USD',
      }));
      expect(result.quote_id).toBeDefined();
      expect(result.expires_at).toBeDefined();
    });
  });

  describe('createDelivery', () => {
    it('should convert request and call the SDK correctly', async () => {
      // Setup
      const deliveryRequest = {
        external_delivery_id: 'test-delivery-123',
        pickup_address: {
          street: '123 Pickup St',
          city: 'San Francisco',
          state: 'CA',
          zip_code: '94105',
          country: 'US',
        },
        dropoff_address: {
          street: '456 Dropoff St',
          city: 'San Francisco',
          state: 'CA',
          zip_code: '94105',
          country: 'US',
        },
        pickup_business_name: 'Test Restaurant',
        items: [{ name: 'Test Item', quantity: 1 }],
      };

      // Mock response
      const mockResponse = {
        data: {
          external_delivery_id: 'test-delivery-123',
          status: 'created',
          fee: 995, // in cents
          currency: 'USD',
          tracking_url: 'https://example.com/track/test-delivery-123',
        },
      };

      // Set up the mock
      (doorDashSDK.createDelivery as any).mockResolvedValue(mockResponse);

      // Execute
      const result = await createDelivery(deliveryRequest);

      // Verify - don't check for specific external_delivery_id since we generate a UUID
      expect(doorDashSDK.createDelivery).toHaveBeenCalledWith(expect.objectContaining({
        pickup_address: expect.stringContaining('123 Pickup St, San Francisco, CA, 94105, US'),
        dropoff_address: expect.stringContaining('456 Dropoff St, San Francisco, CA, 94105, US'),
        pickup_business_name: 'Test Restaurant',
      }));

      // Check result transformation
      expect(result).toEqual(expect.objectContaining({
        external_delivery_id: 'test-delivery-123',
        delivery_status: 'created',
        fee: 9.95, // converted to dollars
        currency: 'USD',
        tracking_url: 'https://example.com/track/test-delivery-123',
      }));
    });
  });

  describe('getDeliveryStatus', () => {
    it('should call the SDK correctly and transform the response', async () => {
      // Setup
      const externalDeliveryId = 'test-delivery-123';

      // Mock response
      const mockResponse = {
        data: {
          external_delivery_id: 'test-delivery-123',
          status: 'delivered',
          fee: 995, // in cents
          currency: 'USD',
          tracking_url: 'https://example.com/track/test-delivery-123',
        },
      };

      // Set up the mock
      (doorDashSDK.getDeliveryStatus as any).mockResolvedValue(mockResponse);

      // Execute
      const result = await getDeliveryStatus(externalDeliveryId);

      // Verify
      expect(doorDashSDK.getDeliveryStatus).toHaveBeenCalledWith(externalDeliveryId);

      // Check result transformation
      expect(result).toEqual(expect.objectContaining({
        external_delivery_id: 'test-delivery-123',
        delivery_status: 'delivered',
        fee: 9.95, // converted to dollars
        currency: 'USD',
        tracking_url: 'https://example.com/track/test-delivery-123',
      }));
    });
  });

  describe('parseWebhook', () => {
    it('should validate webhooks correctly', async () => {
      // Import the actual implementation
      const { verifyWebhookSignature } = await import('../../utils/doorDashAuth.js');
      
      // Mock the validation function
      (verifyWebhookSignature as any).mockReturnValue(true);

      // Test data
      const signature = 'test-signature';
      const timestamp = '1234567890';
      const rawBody = JSON.stringify({
        event_type: 'delivery.status_update',
        delivery_id: 'test-id',
        external_delivery_id: 'test-external-id',
        status: 'delivered',
      });

      // Execute
      const result = await parseWebhook(signature, timestamp, rawBody);

      // Verify
      expect(verifyWebhookSignature).toHaveBeenCalledWith(signature, timestamp, rawBody);
      expect(result.isValid).toBe(true);
      expect(result.payload).toEqual(expect.objectContaining({
        event_type: 'delivery.status_update',
        delivery_id: 'test-id',
        external_delivery_id: 'test-external-id',
      }));
    });

    it('should return isValid: false when signature is invalid', async () => {
      // Import the actual implementation
      const { verifyWebhookSignature } = await import('../../utils/doorDashAuth.js');
      
      // Mock the validation function to return false
      (verifyWebhookSignature as any).mockReturnValue(false);

      // Test data
      const signature = 'invalid-signature';
      const timestamp = '1234567890';
      const rawBody = JSON.stringify({
        event_type: 'delivery.status_update',
        delivery_id: 'test-id',
      });

      // Execute
      const result = await parseWebhook(signature, timestamp, rawBody);

      // Verify
      expect(result.isValid).toBe(false);
      expect(result.payload).toBeUndefined();
    });
  });
}); 