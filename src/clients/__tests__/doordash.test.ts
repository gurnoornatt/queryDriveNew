import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  estimate, 
  createDelivery, 
  DoorDashQuoteRequest,
  DoorDashQuoteResponse,
  DoorDashDeliveryRequest,
  DoorDashDeliveryResponse,
  parseWebhook
} from '../doordash';
import { doorDashAPI } from '../../services/doordash';
import * as doorDashAuth from '../../utils/doorDashAuth';

// Mock the DoorDash API service
vi.mock('../../services/doordash', () => ({
  doorDashAPI: {
    getDeliveryQuote: vi.fn(),
    createDelivery: vi.fn(),
  },
}));

// Mock the doorDashAuth module
vi.mock('../../utils/doorDashAuth', () => ({
  verifyWebhookSignature: vi.fn(),
}));

describe('DoorDash Client', () => {
  describe('estimate', () => {
    // Sample request data
    const sampleQuoteRequest: DoorDashQuoteRequest = {
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
      dropoff_business_name: 'Test Customer',
      pickup_phone_number: '+11234567890',
      dropoff_phone_number: '+10987654321',
    };

    // Sample response data
    const sampleQuoteResponse: DoorDashQuoteResponse = {
      external_delivery_id: 'test-delivery-123',
      quote_id: 'test-quote-123',
      currency: 'USD',
      fee: 9.99,
      expires_at: '2023-05-01T12:00:00Z',
    };

    beforeEach(() => {
      // Clear all mocks before each test
      vi.clearAllMocks();
      
      // Setup the default mock response
      (doorDashAPI.getDeliveryQuote as any).mockResolvedValue(sampleQuoteResponse);
    });

    it('should call the DoorDash API service with correct parameters', async () => {
      // Call the estimate function
      await estimate(sampleQuoteRequest);

      // Check if API was called with the correct parameters
      expect(doorDashAPI.getDeliveryQuote).toHaveBeenCalledWith(expect.objectContaining({
        external_delivery_id: sampleQuoteRequest.external_delivery_id,
        pickup_address: sampleQuoteRequest.pickup_address,
        dropoff_address: sampleQuoteRequest.dropoff_address,
      }));
    });

    it('should return the quote response from the DoorDash API', async () => {
      // Call the estimate function
      const result = await estimate(sampleQuoteRequest);

      // Check if the response matches the expected format
      expect(result).toEqual({
        external_delivery_id: 'test-delivery-123',
        quote_id: 'test-quote-123',
        currency: 'USD',
        fee: 9.99,
        expires_at: '2023-05-01T12:00:00Z',
      });
    });

    it('should handle API errors correctly', async () => {
      // Setup the mock to throw an error
      const testError = new Error('API Error');
      (doorDashAPI.getDeliveryQuote as any).mockRejectedValue(testError);

      // Mock console.error to prevent test output noise
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Expect the function to throw the error
      await expect(estimate(sampleQuoteRequest)).rejects.toThrow('API Error');

      // Check if error was logged
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });

  describe('createDelivery', () => {
    // Sample request data
    const sampleDeliveryRequest: DoorDashDeliveryRequest = {
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
      dropoff_business_name: 'Test Customer',
      pickup_phone_number: '+11234567890',
      dropoff_phone_number: '+10987654321',
      items: [
        {
          name: 'Test Item',
          quantity: 1,
          description: 'Test description'
        }
      ]
    };

    // Sample response data
    const sampleDeliveryResponse = {
      id: 'dd-delivery-123',
      external_delivery_id: 'test-delivery-123',
      status: 'created',
      tracking_url: 'https://track.doordash.com/order/123',
      fee: 9.99,
      currency: 'USD',
    };

    beforeEach(() => {
      // Clear all mocks before each test
      vi.clearAllMocks();
      
      // Setup the default mock response
      (doorDashAPI.createDelivery as any).mockResolvedValue(sampleDeliveryResponse);
    });

    it('should call the DoorDash API service with correct parameters', async () => {
      // Call the createDelivery function
      await createDelivery(sampleDeliveryRequest);

      // Check if API was called with the correct parameters
      expect(doorDashAPI.createDelivery).toHaveBeenCalledWith(expect.objectContaining({
        external_delivery_id: sampleDeliveryRequest.external_delivery_id,
        pickup_address: sampleDeliveryRequest.pickup_address,
        dropoff_address: sampleDeliveryRequest.dropoff_address,
        pickup_contact: expect.any(Object),
        dropoff_contact: expect.any(Object),
      }));
    });

    it('should return the delivery response from the DoorDash API', async () => {
      // Call the createDelivery function
      const result = await createDelivery(sampleDeliveryRequest);

      // Check if the response matches the expected format
      expect(result).toEqual({
        external_delivery_id: 'test-delivery-123',
        delivery_id: 'dd-delivery-123',
        delivery_status: 'created',
        tracking_url: 'https://track.doordash.com/order/123',
        fee: 9.99,
        currency: 'USD',
      });
    });

    it('should handle API errors correctly', async () => {
      // Setup the mock to throw an error
      const testError = new Error('API Error');
      (doorDashAPI.createDelivery as any).mockRejectedValue(testError);

      // Mock console.error to prevent test output noise
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Expect the function to throw the error
      await expect(createDelivery(sampleDeliveryRequest)).rejects.toThrow('API Error');

      // Check if error was logged
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });

  describe('parseWebhook', () => {
    const mockSignature = 'test-signature';
    const mockTimestamp = '1234567890';
    const mockRawBody = JSON.stringify({
      event_type: 'delivery_status_update',
      delivery_id: 'test-delivery-id',
      external_delivery_id: 'ext-123456',
      status: 'delivered',
      estimated_delivery_time: '2023-09-15T14:30:00Z',
      fee: 1250,
      currency: 'USD'
    });

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return isValid: false when required parameters are missing', async () => {
      const result1 = await parseWebhook('', mockTimestamp, mockRawBody);
      const result2 = await parseWebhook(mockSignature, '', mockRawBody);
      const result3 = await parseWebhook(mockSignature, mockTimestamp, '');

      expect(result1.isValid).toBe(false);
      expect(result2.isValid).toBe(false);
      expect(result3.isValid).toBe(false);
      expect(result1.payload).toBeUndefined();
      expect(result2.payload).toBeUndefined();
      expect(result3.payload).toBeUndefined();
    });

    it('should return isValid: false when signature verification fails', async () => {
      vi.mocked(doorDashAuth.verifyWebhookSignature).mockReturnValue(false);

      const result = await parseWebhook(mockSignature, mockTimestamp, mockRawBody);

      expect(doorDashAuth.verifyWebhookSignature).toHaveBeenCalledWith(
        mockSignature,
        mockTimestamp,
        mockRawBody
      );
      expect(result.isValid).toBe(false);
      expect(result.payload).toBeUndefined();
    });

    it('should return isValid: false when JSON parsing fails', async () => {
      vi.mocked(doorDashAuth.verifyWebhookSignature).mockReturnValue(true);
      
      const result = await parseWebhook(mockSignature, mockTimestamp, 'invalid-json');

      expect(result.isValid).toBe(false);
      expect(result.payload).toBeUndefined();
    });

    it('should return isValid: false when payload is missing required fields', async () => {
      vi.mocked(doorDashAuth.verifyWebhookSignature).mockReturnValue(true);
      
      const incompletePayload1 = JSON.stringify({ delivery_id: 'test-id' }); // Missing event_type
      const incompletePayload2 = JSON.stringify({ event_type: 'test-event' }); // Missing delivery_id
      
      const result1 = await parseWebhook(mockSignature, mockTimestamp, incompletePayload1);
      const result2 = await parseWebhook(mockSignature, mockTimestamp, incompletePayload2);

      expect(result1.isValid).toBe(false);
      expect(result2.isValid).toBe(false);
    });

    it('should return isValid: true and parsed payload when verification succeeds', async () => {
      vi.mocked(doorDashAuth.verifyWebhookSignature).mockReturnValue(true);
      
      const result = await parseWebhook(mockSignature, mockTimestamp, mockRawBody);

      expect(doorDashAuth.verifyWebhookSignature).toHaveBeenCalledWith(
        mockSignature, 
        mockTimestamp, 
        mockRawBody
      );
      expect(result.isValid).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload?.event_type).toBe('delivery_status_update');
      expect(result.payload?.delivery_id).toBe('test-delivery-id');
      expect(result.payload?.external_delivery_id).toBe('ext-123456');
    });
  });
}); 