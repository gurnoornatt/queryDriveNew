import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleDoorDashWebhook } from '../webhookRoutes';
import * as doorDashAuth from '../../utils/doorDashAuth';

// Mock doorDashAuth utilities
vi.mock('../../utils/doorDashAuth', () => ({
  verifyWebhookSignature: vi.fn(),
}));

describe('Webhook Routes', () => {
  describe('handleDoorDashWebhook', () => {
    let req: any;
    let res: any;
    let next: any;

    beforeEach(() => {
      // Reset mocks
      vi.clearAllMocks();
      
      // Setup simple mock request, response, and next
      req = {
        body: {},
        header: vi.fn(),
      };
      
      res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      };
      
      next = vi.fn();
    });

    it('should return 401 if signature header is missing', () => {
      // Mock headers
      req.header.mockImplementation((name: string) => {
        if (name === 'X-DoorDash-Timestamp') return '1677721600000';
        return undefined;
      });

      // Call the handler
      handleDoorDashWebhook(req, res, next);

      // Assert response
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Missing required DoorDash webhook headers',
      });
    });

    it('should return 401 if timestamp header is missing', () => {
      // Mock headers
      req.header.mockImplementation((name: string) => {
        if (name === 'X-DoorDash-Signature') return 'test-signature';
        return undefined;
      });

      // Call the handler
      handleDoorDashWebhook(req, res, next);

      // Assert response
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Missing required DoorDash webhook headers',
      });
    });

    it('should return 401 if signature is invalid', () => {
      // Mock headers
      req.header.mockImplementation((name: string) => {
        if (name === 'X-DoorDash-Signature') return 'test-signature';
        if (name === 'X-DoorDash-Timestamp') return '1677721600000';
        return undefined;
      });

      // Mock payload
      req.body = {
        event_type: 'delivery.status_update',
        delivery_id: 'test-delivery-id',
        external_delivery_id: 'test-external-id',
        timestamp: '2023-05-01T10:00:00Z',
        delivery_status: 'picked_up',
      };

      // Mock verification failure
      (doorDashAuth.verifyWebhookSignature as any).mockReturnValue(false);

      // Call the handler
      handleDoorDashWebhook(req, res, next);

      // Assert verification was called
      expect(doorDashAuth.verifyWebhookSignature).toHaveBeenCalledWith(
        'test-signature',
        '1677721600000',
        JSON.stringify(req.body)
      );

      // Assert response
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid webhook signature',
      });
    });

    it('should process valid webhook and return 200', () => {
      // Mock headers
      req.header.mockImplementation((name: string) => {
        if (name === 'X-DoorDash-Signature') return 'valid-signature';
        if (name === 'X-DoorDash-Timestamp') return '1677721600000';
        return undefined;
      });

      // Mock payload
      req.body = {
        event_type: 'delivery.status_update',
        delivery_id: 'test-delivery-id',
        external_delivery_id: 'test-external-id',
        timestamp: '2023-05-01T10:00:00Z',
        delivery_status: 'delivered',
      };

      // Mock verification success
      (doorDashAuth.verifyWebhookSignature as any).mockReturnValue(true);

      // Call the handler
      handleDoorDashWebhook(req, res, next);

      // Assert verification was called
      expect(doorDashAuth.verifyWebhookSignature).toHaveBeenCalledWith(
        'valid-signature',
        '1677721600000',
        JSON.stringify(req.body)
      );

      // Assert response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Webhook processed successfully',
        received_at: expect.any(String),
        event_type: 'delivery.status_update'
      });
    });

    it('should pass errors to next middleware', () => {
      // Setup to throw an error
      req.header.mockImplementation(() => {
        throw new Error('Test error');
      });

      // Call the handler
      handleDoorDashWebhook(req, res, next);

      // Assert next was called with the error
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
}); 