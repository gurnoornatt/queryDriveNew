import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { DoorDashClient } from '../client';
import * as doorDashAuth from '../../../utils/doorDashAuth';

// Mock axios
vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn(() => ({
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        interceptors: {
          request: {
            use: vi.fn((callback) => {
              // Store the callback for testing
              (axios as any).requestInterceptor = callback;
              return { dispose: vi.fn() };
            }),
          },
        },
      })),
    },
  };
});

// Mock auth utils
vi.mock('../../../utils/doorDashAuth', () => {
  return {
    DD_API_BASE_URL: 'https://openapi.doordash.com/drive/v2',
    getAuthHeaders: vi.fn(() => ({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer mock-dev-id',
      'X-DoorDash-Signature': 'mock-signature',
      'X-DoorDash-Developer-Id': 'mock-dev-id',
      'X-DoorDash-Key-Id': 'mock-key-id',
      'X-DoorDash-Timestamp': '1677721600000',
    })),
  };
});

describe('DoorDashClient', () => {
  let client: DoorDashClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Create a new client instance
    client = new DoorDashClient();

    // Get the mocked axios instance
    mockAxiosInstance = (axios.create as any).mock.results[0].value;
  });

  it('should initialize with the correct configuration', () => {
    expect(axios.create).toHaveBeenCalledWith({
      baseURL: doorDashAuth.DD_API_BASE_URL,
      timeout: 30000,
    });
  });

  it('should add a request interceptor on initialization', () => {
    expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalledTimes(1);
  });

  it('should call getAuthHeaders with the correct arguments in the interceptor', () => {
    // Setup mock request config
    const mockConfig = {
      method: 'post',
      url: '/test-path',
      data: { key: 'value' },
      headers: new Headers(),
    };

    // Get the interceptor function and call it
    const interceptorFn = (axios as any).requestInterceptor;
    interceptorFn(mockConfig);

    // Verify getAuthHeaders was called with the correct arguments
    expect(doorDashAuth.getAuthHeaders).toHaveBeenCalledWith(
      'POST',
      '/test-path',
      JSON.stringify({ key: 'value' })
    );
  });

  describe('HTTP Methods', () => {
    beforeEach(() => {
      // Mock successful responses
      mockAxiosInstance.get.mockResolvedValue({ data: { id: '123' } });
      mockAxiosInstance.post.mockResolvedValue({ data: { id: '456' } });
      mockAxiosInstance.put.mockResolvedValue({ data: { id: '789' } });
      mockAxiosInstance.delete.mockResolvedValue({ data: { id: '101' } });
    });

    it('should make a GET request and return the data', async () => {
      const response = await client.get('/test');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', undefined);
      expect(response).toEqual({ id: '123' });
    });

    it('should make a POST request and return the data', async () => {
      const data = { name: 'Test' };
      const response = await client.post('/test', data);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', data, undefined);
      expect(response).toEqual({ id: '456' });
    });

    it('should make a PUT request and return the data', async () => {
      const data = { name: 'Test Updated' };
      const response = await client.put('/test/123', data);
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test/123', data, undefined);
      expect(response).toEqual({ id: '789' });
    });

    it('should make a DELETE request and return the data', async () => {
      const response = await client.delete('/test/123');
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test/123', undefined);
      expect(response).toEqual({ id: '101' });
    });
  });

  describe('Error Handling', () => {
    it('should propagate errors from the axios instance', async () => {
      // Setup mock error
      const mockError = new Error('API Error');
      mockAxiosInstance.get.mockRejectedValue(mockError);

      // Expect the client to propagate the error
      await expect(client.get('/test')).rejects.toThrow('API Error');
    });
  });
}); 