import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebhookProvider, WebhookEventType, WebhookDeliveryStatus, DeliveryStatusWebhookEvent } from '../types';
import { DoorDashWebhookProcessor } from '../DoorDashWebhookProcessor';
import { UberWebhookProcessor } from '../UberWebhookProcessor';
import { WebhookProcessorFactory } from '../WebhookProcessorFactory';
import { WebhookQueue } from '../WebhookQueue';
import { WebhookStorage } from '../WebhookStorage';
import * as doorDashAuthUtils from '../../utils/doorDashAuth';

// Mock the webhook storage
vi.mock('../WebhookStorage', () => {
  const mockStorage = {
    saveWebhook: vi.fn(),
    getWebhook: vi.fn(),
    getAllWebhooks: vi.fn().mockReturnValue([]),
    getWebhooksByProvider: vi.fn().mockReturnValue([]),
    getWebhooksByStatus: vi.fn().mockReturnValue([]),
    getInstance: vi.fn()
  };
  
  return {
    WebhookStorage: {
      getInstance: vi.fn().mockReturnValue(mockStorage)
    }
  };
});

// Mock the authentication utilities
vi.mock('../../utils/doorDashAuth', () => ({
  verifyWebhookSignature: vi.fn() // Default mock, can be overridden in tests
}));

vi.mock('crypto', () => ({
  default: { // Assuming crypto is used as a default export in Uber processor
    createHmac: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnThis(),
      digest: vi.fn().mockReturnValue('valid-signature')
    })
  }
}));

describe('Webhook System', () => {
  let doorDashProcessor: DoorDashWebhookProcessor;
  let uberProcessor: UberWebhookProcessor;
  let mockStorageInstance: any;

  beforeEach(() => {
    // Get the mocked storage instance
    mockStorageInstance = WebhookStorage.getInstance();
    
    doorDashProcessor = new DoorDashWebhookProcessor();
    uberProcessor = new UberWebhookProcessor('test-uber-secret'); // Provide a secret for Uber processor
    
    // Reset all mocks before each test
    vi.resetAllMocks();

    // Setup default mock implementations
    (mockStorageInstance.storeWebhook as any).mockImplementation((provider: WebhookProvider, rawData: any) => ({
      id: 'mock-webhook-id-' + Date.now(),
      provider,
      rawData,
      receivedAt: new Date(),
      processingAttempts: 0,
      status: 'pending'
    }));
    (mockStorageInstance.updateWebhook as any).mockResolvedValue(undefined);
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('DoorDash Webhook Processor', () => {
    it('should verify valid DoorDash webhook signatures using verifyWebhook', async () => {
      const mockPayload = { event_type: 'delivery_status_update', data: { delivery_status: 'delivered' } };
      const mockHeaders = { 'x-doordash-signature': 'valid-signature', 'x-doordash-signature-timestamp': '1234567890' };
      (doorDashAuthUtils.verifyWebhookSignature as any).mockReturnValue(true);
      
      const result = await doorDashProcessor.verifyWebhook(mockPayload, mockHeaders);
      expect(result).toBe(true);
      expect(doorDashAuthUtils.verifyWebhookSignature).toHaveBeenCalledWith(mockPayload, 'valid-signature', '1234567890');
    });

    it('should return false from verifyWebhook if headers are missing', async () => {
      const mockPayload = { event_type: 'delivery_status_update', data: { delivery_status: 'delivered' } };
      const result = await doorDashProcessor.verifyWebhook(mockPayload, {});
      expect(result).toBe(false);
    });

    it('should process a valid DoorDash webhook correctly', async () => {
      const mockRawData = {
        event_type: 'delivery_status_update',
        event_id: 'dd-event-123',
        created_at: '2023-01-01T12:00:00Z',
        data: {
          external_delivery_id: 'dd-ext-id-456',
          delivery_id: 'dd-del-id-789',
          delivery_status: 'delivered',
        }
      };
      const mockHeaders = { 'x-doordash-signature': 'valid-signature', 'x-doordash-signature-timestamp': '1234567890' };

      // Mock verifyWebhook to return true for this test
      vi.spyOn(doorDashProcessor, 'verifyWebhook').mockResolvedValue(true);

      const result = await doorDashProcessor.processWebhook(mockRawData, mockHeaders);

      expect(doorDashProcessor.verifyWebhook).toHaveBeenCalledWith(mockRawData, mockHeaders);
      expect(mockStorageInstance.storeWebhook).toHaveBeenCalledWith(WebhookProvider.DOORDASH, mockRawData);
      
      const storedWebhookId = (mockStorageInstance.storeWebhook as any).mock.results[0].value.id;

      expect(mockStorageInstance.updateWebhook).toHaveBeenCalledWith(
        storedWebhookId,
        expect.objectContaining({
          success: true,
          message: 'Processed delivery.status_changed event for delivery dd-del-id-789',
          event: expect.objectContaining({
            id: 'dd-event-123',
            provider: WebhookProvider.DOORDASH,
            eventType: WebhookEventType.DELIVERY_STATUS_CHANGED,
            timestamp: new Date('2023-01-01T12:00:00Z'),
            deliveryId: 'dd-del-id-789',
            externalDeliveryId: 'dd-ext-id-456',
            status: WebhookDeliveryStatus.DELIVERED,
            rawData: mockRawData
          })
        })
      );

      expect(result.success).toBe(true);
      expect(result.event).toBeDefined();
      expect(result.event?.provider).toBe(WebhookProvider.DOORDASH);
      expect(result.event?.eventType).toBe(WebhookEventType.DELIVERY_STATUS_CHANGED);
    });

    it('should return failure if DoorDash signature is invalid during processWebhook', async () => {
      const mockRawData = { event_type: 'test' };
      const mockHeaders = { 'x-doordash-signature': 'invalid-signature', 'x-doordash-signature-timestamp': '123' };
      vi.spyOn(doorDashProcessor, 'verifyWebhook').mockResolvedValue(false);

      const result = await doorDashProcessor.processWebhook(mockRawData, mockHeaders);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid webhook signature');
      expect(mockStorageInstance.storeWebhook).not.toHaveBeenCalled();
      expect(mockStorageInstance.updateWebhook).not.toHaveBeenCalled();
    });
  });
  
  describe('Uber Webhook Processor', () => {
    it('should verify valid Uber webhook signatures using verifyWebhook', async () => {
      const mockPayload = { event_type: 'delivery.status.changed', meta: { status: 'delivered' } };
      const mockHeaders = { 'x-uber-signature': 'valid-signature' };
      // Uber's verifyWebhook uses crypto directly, which is mocked globally now

      const result = await uberProcessor.verifyWebhook(mockPayload, mockHeaders);
      expect(result).toBe(true);
    });

    it('should return false from verifyWebhook if Uber signature header is missing', async () => {
      const mockPayload = { event_type: 'delivery.status.changed' };
      const result = await uberProcessor.verifyWebhook(mockPayload, {});
      expect(result).toBe(false);
    });

    it('should process a valid Uber webhook correctly', async () => {
      const mockRawData = {
        event_type: 'delivery.status.changed',
        event_id: 'uber-event-123',
        event_time: 1672574400, // 2023-01-01T12:00:00Z
        meta: {
          resource_id: 'uber-del-id-789',
          status: 'delivered',
        }
      };
      const mockHeaders = { 'x-uber-signature': 'valid-signature' };
      vi.spyOn(uberProcessor, 'verifyWebhook').mockResolvedValue(true);


      const result = await uberProcessor.processWebhook(mockRawData, mockHeaders);

      expect(uberProcessor.verifyWebhook).toHaveBeenCalledWith(mockRawData, mockHeaders);
      expect(mockStorageInstance.storeWebhook).toHaveBeenCalledWith(WebhookProvider.UBER, mockRawData);

      const storedWebhookId = (mockStorageInstance.storeWebhook as any).mock.results[0].value.id;

      expect(mockStorageInstance.updateWebhook).toHaveBeenCalledWith(
        storedWebhookId,
        expect.objectContaining({
          success: true,
          message: 'Processed delivery.status_changed event for delivery uber-del-id-789',
          event: expect.objectContaining({
            id: 'uber-event-123',
            provider: WebhookProvider.UBER,
            eventType: WebhookEventType.DELIVERY_STATUS_CHANGED,
            timestamp: new Date(1672574400 * 1000),
            deliveryId: 'uber-del-id-789',
            status: WebhookDeliveryStatus.DELIVERED,
            rawData: mockRawData
          })
        })
      );

      expect(result.success).toBe(true);
      expect(result.event).toBeDefined();
      expect(result.event?.provider).toBe(WebhookProvider.UBER);
      expect(result.event?.eventType).toBe(WebhookEventType.DELIVERY_STATUS_CHANGED);
    });
    
    it('should return failure if Uber signature is invalid during processWebhook', async () => {
      const mockRawData = { event_type: 'test' };
      const mockHeaders = { 'x-uber-signature': 'invalid-signature' };
      vi.spyOn(uberProcessor, 'verifyWebhook').mockResolvedValue(false);

      const result = await uberProcessor.processWebhook(mockRawData, mockHeaders);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid webhook signature');
      expect(mockStorageInstance.storeWebhook).not.toHaveBeenCalled();
      expect(mockStorageInstance.updateWebhook).not.toHaveBeenCalled();
    });
  });
  
  describe('WebhookProcessorFactory', () => {
    it('should return the correct processor for DoorDash', () => {
      const processor = WebhookProcessorFactory.getProcessor(WebhookProvider.DOORDASH);
      expect(processor).toBeInstanceOf(DoorDashWebhookProcessor);
    });
    
    it('should return the correct processor for Uber', () => {
      const processor = WebhookProcessorFactory.getProcessor(WebhookProvider.UBER);
      expect(processor).toBeInstanceOf(UberWebhookProcessor);
    });
    
    it('should return the correct processor by name', () => {
      const doorDashProcessor = WebhookProcessorFactory.getProcessorByName('doordash');
      expect(doorDashProcessor).toBeInstanceOf(DoorDashWebhookProcessor);
      
      const uberProcessor = WebhookProcessorFactory.getProcessorByName('uber');
      expect(uberProcessor).toBeInstanceOf(UberWebhookProcessor);
    });
    
    it('should throw an error for unsupported providers', () => {
      expect(() => WebhookProcessorFactory.getProcessor('invalid' as WebhookProvider))
        .toThrow('Unsupported webhook provider: invalid');
      
      expect(() => WebhookProcessorFactory.getProcessorByName('invalid'))
        .toThrow('Unsupported webhook provider: invalid');
    });
  });
  
  describe('WebhookQueue', () => {
    it('should add webhooks to the queue', async () => {
      const queue = WebhookQueue.getInstance();
      const mockStorage = WebhookStorage.getInstance();
      
      const mockPayload = { test: 'data' };
      await queue.addToQueue(WebhookProvider.DOORDASH, mockPayload);
      
      expect(mockStorage.saveWebhook).toHaveBeenCalled();
    });
  });
}); 