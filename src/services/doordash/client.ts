import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosHeaders } from 'axios';
import { DD_API_BASE_URL, getAuthHeaders } from '../../utils/doorDashAuth';

/**
 * DoorDash API client for making authenticated requests to the DoorDash Drive API
 */
export class DoorDashClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: DD_API_BASE_URL,
      timeout: 30000, // 30 seconds
    });

    // Add request interceptor to handle authentication
    this.client.interceptors.request.use((config) => {
      // Extract required parts for authentication
      const method = config.method?.toUpperCase() || 'GET';
      const path = config.url || '';
      const body = config.data ? JSON.stringify(config.data) : '';

      // Add auth headers to the request
      const authHeaders = getAuthHeaders(method, path, body);
      
      // Create headers if they don't exist
      config.headers = config.headers || new AxiosHeaders();
      
      // Add each auth header individually
      Object.entries(authHeaders).forEach(([key, value]) => {
        config.headers.set(key, value);
      });

      return config;
    });
  }

  /**
   * Make a GET request to the DoorDash API
   * 
   * @param path - API endpoint path (without base URL)
   * @param config - Additional Axios request configuration
   * @returns Promise with the response data
   */
  public async get<T = any>(
    path: string, 
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(path, config);
    return response.data;
  }

  /**
   * Make a POST request to the DoorDash API
   * 
   * @param path - API endpoint path (without base URL)
   * @param data - Request body data
   * @param config - Additional Axios request configuration
   * @returns Promise with the response data
   */
  public async post<T = any>(
    path: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(path, data, config);
    return response.data;
  }

  /**
   * Make a PUT request to the DoorDash API
   * 
   * @param path - API endpoint path (without base URL)
   * @param data - Request body data
   * @param config - Additional Axios request configuration
   * @returns Promise with the response data
   */
  public async put<T = any>(
    path: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(path, data, config);
    return response.data;
  }

  /**
   * Make a PATCH request to the DoorDash API
   * 
   * @param path - API endpoint path (without base URL)
   * @param data - Request body data
   * @param config - Additional Axios request configuration
   * @returns Promise with the response data
   */
  public async patch<T = any>(
    path: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(path, data, config);
    return response.data;
  }

  /**
   * Make a DELETE request to the DoorDash API
   * 
   * @param path - API endpoint path (without base URL)
   * @param config - Additional Axios request configuration
   * @returns Promise with the response data
   */
  public async delete<T = any>(
    path: string, 
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(path, config);
    return response.data;
  }
} 