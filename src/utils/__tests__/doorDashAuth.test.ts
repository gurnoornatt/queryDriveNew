import crypto from 'crypto';
import { generateSignature, getAuthHeaders } from '../doorDashAuth';
import { describe, expect, it, vi } from 'vitest';

// Mock process.env
vi.mock('process', () => ({
  env: {
    DD_DEVELOPER_ID: 'test-developer-id',
    DD_KEY_ID: 'test-key-id',
    DD_SIGNING_SECRET: 'test-signing-secret',
  },
}));

describe('DoorDash Authentication Utilities', () => {
  describe('generateSignature', () => {
    it('should generate a valid HMAC signature', () => {
      // Setup test data
      const method = 'POST';
      const path = '/quotes';
      const body = JSON.stringify({ test: 'data' });
      const timestamp = 1677721600000; // Fixed timestamp for testing

      // Generate signature
      const signature = generateSignature(method, path, body, timestamp);

      // Assert signature format (hex string of correct length)
      expect(signature).toMatch(/^[a-f0-9]{64}$/);
      
      // Basic verification that signature changes with inputs
      const differentSignature = generateSignature('GET', path, body, timestamp);
      expect(signature).not.toBe(differentSignature);
    });

    it('should handle empty body correctly', () => {
      // Setup test data
      const method = 'GET';
      const path = '/deliveries/123';
      const timestamp = 1677721600000; // Fixed timestamp for testing

      // Generate signature
      const signature = generateSignature(method, path, '', timestamp);

      // Assert signature format (hex string of correct length)
      expect(signature).toMatch(/^[a-f0-9]{64}$/);
      
      // Basic verification that signature changes with inputs
      const differentSignature = generateSignature(method, '/different', '', timestamp);
      expect(signature).not.toBe(differentSignature);
    });
  });

  describe('getAuthHeaders', () => {
    it('should return correct headers with auth information', () => {
      // Setup test data
      const method = 'POST';
      const path = '/deliveries';
      const body = JSON.stringify({ test: 'data' });
      
      // Mock Date.now to return a fixed timestamp
      const mockTimestamp = 1677721600000;
      vi.spyOn(Date, 'now').mockImplementation(() => mockTimestamp);

      // Generate headers
      const headers = getAuthHeaders(method, path, body);

      // Assert - only test structure and presence of values
      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'Authorization': expect.stringContaining('Bearer '),
        'X-DoorDash-Signature': expect.stringMatching(/^[a-f0-9]{64}$/),
        'X-DoorDash-Developer-Id': expect.any(String),
        'X-DoorDash-Key-Id': expect.any(String),
        'X-DoorDash-Timestamp': mockTimestamp.toString(),
      });

      // Restore Date.now
      vi.restoreAllMocks();
    });
  });
}); 