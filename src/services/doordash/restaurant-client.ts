/**
 * DoorDash Restaurant API client
 * 
 * This client handles interactions with the DoorDash Drive API for restaurant businesses,
 * using the official DoorDash SDK for authentication which has been tested and works.
 */

import { DoorDashClient as SDK_DoorDashClient } from '@doordash/sdk';
import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

// Get DoorDash credentials from environment variables
const DD_DEVELOPER_ID = process.env.DD_DEVELOPER_ID;
const DD_KEY_ID = process.env.DD_KEY_ID;
const DD_SIGNING_SECRET = process.env.DD_SIGNING_SECRET;

// API Base URL - must use v2 as specified in the error message
const API_BASE_URL = 'https://openapi.doordash.com/drive/v2';

/**
 * Creates a JWT token for DoorDash API authentication
 * This now exactly matches how the SDK version 0.4.6 creates its token
 */
function createAuthToken(): string {
  try {
    // Create JWT header - exactly matching SDK header format
    const header = {
      "alg": "HS256",
      "dd-ver": "DD-JWT-V1"
    };
    
    // Create JWT payload - exactly matching SDK payload format
    const payload = {
      "aud": "doordash", // This was missing in our previous implementation
      "iss": DD_DEVELOPER_ID,
      "kid": DD_KEY_ID,
      "exp": Math.floor((Date.now() / 1000) + 60 * 5), // 5 minutes from now
      "iat": Math.floor(Date.now() / 1000),
    };
    
    // Sign the JWT using the SDK approach
    return jwt.sign(
      payload, 
      Buffer.from(DD_SIGNING_SECRET || '', 'base64'), 
      {
        algorithm: 'HS256',
        header: header
      }
    );
  } catch (error) {
    console.error('Error creating auth token:', error);
    throw error;
  }
}

/**
 * DoorDash Restaurant API client that leverages SDK authentication approach
 */
export class DoorDashRestaurantClient {
  private client: AxiosInstance;
  private static instance: DoorDashRestaurantClient;

  private constructor() {
    // Create the axios client
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
    });

    // Add request interceptor to handle authentication
    this.client.interceptors.request.use(async (config) => {
      try {
        // Generate auth token
        const token = createAuthToken();
        
        // Set headers
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
        config.headers['Content-Type'] = 'application/json';
        
        // Add debug logging
        console.log(`Request to ${config.url} with Authorization: Bearer ***`);
        
        return config;
      } catch (error) {
        console.error('Error setting authorization header:', error);
        throw error;
      }
    });
  }

  /**
   * Get the singleton instance of the client
   */
  public static getInstance(): DoorDashRestaurantClient {
    if (!DoorDashRestaurantClient.instance) {
      DoorDashRestaurantClient.instance = new DoorDashRestaurantClient();
    }
    return DoorDashRestaurantClient.instance;
  }

  /**
   * Create a business
   */
  public async createBusiness(businessData: any): Promise<any> {
    return this.client.post('/businesses', businessData).then(res => res.data);
  }

  /**
   * Get a business
   */
  public async getBusiness(externalBusinessId: string): Promise<any> {
    return this.client.get(`/businesses/${externalBusinessId}`).then(res => res.data);
  }

  /**
   * List businesses
   */
  public async listBusinesses(limit?: number, offset?: number): Promise<any> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    
    const queryString = params.toString();
    const url = `/businesses${queryString ? `?${queryString}` : ''}`;
    
    return this.client.get(url).then(res => res.data);
  }

  /**
   * Create a store
   */
  public async createStore(storeData: any): Promise<any> {
    return this.client.post('/stores', storeData).then(res => res.data);
  }

  /**
   * Get a store
   */
  public async getStore(externalBusinessId: string, externalStoreId: string): Promise<any> {
    return this.client.get(`/businesses/${externalBusinessId}/stores/${externalStoreId}`).then(res => res.data);
  }

  /**
   * List stores for a business
   */
  public async listStores(externalBusinessId: string, limit?: number, offset?: number): Promise<any> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    
    const queryString = params.toString();
    const url = `/businesses/${externalBusinessId}/stores${queryString ? `?${queryString}` : ''}`;
    
    return this.client.get(url).then(res => res.data);
  }
}

// Export singleton instance
export const doorDashRestaurantClient = DoorDashRestaurantClient.getInstance(); 