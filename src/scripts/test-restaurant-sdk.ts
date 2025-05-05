/**
 * Test script for DoorDash restaurant API using the DoorDash SDK
 * 
 * This script uses the official DoorDash SDK for authentication which works correctly
 * with the current credentials, but tests the restaurant-specific functionality.
 * 
 * Usage: npm run ts-node src/scripts/test-restaurant-sdk.ts
 */

import { v4 as uuidv4 } from 'uuid';
import { doorDashSDK } from '../services/doordash-sdk/client';
import axios, { AxiosHeaders } from 'axios';
import dotenv from 'dotenv';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// Load and check environment variables
dotenv.config();

// Verify credentials are set
const DD_DEVELOPER_ID = process.env.DD_DEVELOPER_ID;
const DD_KEY_ID = process.env.DD_KEY_ID;
const DD_SIGNING_SECRET = process.env.DD_SIGNING_SECRET;

if (!DD_DEVELOPER_ID || !DD_KEY_ID || !DD_SIGNING_SECRET) {
  console.error('\n❌ ERROR: Missing DoorDash credentials.');
  console.error('Please check your .env file and make sure the following variables are set:');
  console.error('  - DD_DEVELOPER_ID');
  console.error('  - DD_KEY_ID');
  console.error('  - DD_SIGNING_SECRET');
  process.exit(1);
}

// Set up test IDs
const businessId = `business-${uuidv4()}`;
const storeId = `store-${uuidv4()}`;

/**
 * Create auth headers specifically for DoorDash SDK version 0.4.6
 */
function createAuthHeaders(): Record<string, string> {
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
    const token = jwt.sign(
      payload, 
      Buffer.from(DD_SIGNING_SECRET || '', 'base64'), 
      {
        algorithm: 'HS256',
        header: header
      }
    );
    
    // Return headers
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  } catch (error) {
    console.error('Error creating auth headers:', error);
    throw error;
  }
}

/**
 * Create an authenticated axios instance
 */
function createAuthenticatedAxios() {
  // Create axios instance with base URL
  const axiosInstance = axios.create({
    baseURL: 'https://openapi.doordash.com/drive/v2',
    timeout: 30000
  });
  
  // For each request, add auth headers
  axiosInstance.interceptors.request.use(config => {
    // Get auth headers
    const headers = createAuthHeaders();
    
    // Create new axios headers if not exist
    if (!config.headers) {
      config.headers = new AxiosHeaders();
    }
    
    // Add headers to request
    Object.entries(headers).forEach(([key, value]) => {
      config.headers && config.headers.set(key, value);
    });
    
    return config;
  });
  
  return axiosInstance;
}

async function testRestaurantAPI() {
  console.log('==== DoorDash Restaurant API Test (with SDK Auth) ====');
  
  try {
    // First validate that the normal SDK is working
    console.log('\nValidating regular SDK authentication...');
    try {
      const timestamp = new Date().getTime();
      const quoteId = `quote-${timestamp}-${uuidv4().substring(0, 8)}`;
      
      const quoteResponse = await doorDashSDK.getDeliveryQuote({
        external_delivery_id: quoteId,
        pickup_address: "901 Market Street, San Francisco, CA 94103",
        dropoff_address: "901 Market Street, San Francisco, CA 94103",
        pickup_phone_number: "+12065551212",
        pickup_business_name: "Test Restaurant",
        dropoff_phone_number: "+12065551313",
        dropoff_business_name: "Test Customer"
      });
      
      console.log('✅ Regular SDK authentication works!');
    } catch (error: any) {
      console.error('❌ Regular SDK authentication failed:', error.message);
      if (error.response?.data) {
        console.error('Response data:', error.response.data);
      }
      console.error('\nSkipping restaurant API test since SDK auth is failing.');
      return;
    }
    
    // Create authenticated axios client
    const client = createAuthenticatedAxios();
    console.log('\nAuthenticated client created successfully');
    
    // Step 1: Create a restaurant business
    console.log('\n1. Creating restaurant business...');
    try {
      const response = await client.post('/businesses', {
        external_business_id: businessId,
        name: 'Test Restaurant Business'
      });
      
      console.log('Created business:', response.data);
      
      // Step 2: Get business details
      console.log('\n2. Getting business details...');
      const businessResponse = await client.get(`/businesses/${businessId}`);
      console.log('Business details:', businessResponse.data);
      
      // Step 3: Create a store for the business
      console.log('\n3. Creating store for business...');
      const storeResponse = await client.post('/stores', {
        external_store_id: storeId,
        external_business_id: businessId,
        name: 'Test Restaurant Location',
        address: {
          street: '901 Market Street',
          city: 'San Francisco',
          state: 'CA',
          zip_code: '94103',
          country: 'US'
        },
        phone_number: '+14155550123'
      });
      
      console.log('Created store:', storeResponse.data);
      
      // Step 4: List businesses
      console.log('\n4. Listing businesses...');
      const listResponse = await client.get('/businesses');
      console.log(`Found ${listResponse.data.businesses.length} businesses`);
      
      console.log('\n==== Test completed successfully ====');
      console.log(`Business ID: ${businessId}`);
      console.log(`Store ID: ${storeId}`);
      
    } catch (error: any) {
      console.error('Error in API call:', error.message);
      if (error.response?.data) {
        console.error('Response data:', error.response.data);
      }
      if (error.response?.status === 401) {
        console.error('\n❌ Authentication failed (401 Unauthorized)');
        console.error('Please check your DoorDash credentials in the .env file.');
        console.error('Your API key may have expired or be invalid.');
      }
    }
  } catch (error: any) {
    console.error('Error during test setup:', error);
  }
}

// Run the test
testRestaurantAPI(); 