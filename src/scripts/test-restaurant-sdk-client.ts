/**
 * Test script for DoorDash restaurant client that uses SDK authentication
 * 
 * This script tests our new DoorDashRestaurantClient which leverages the SDK's 
 * authentication mechanism while providing restaurant-specific API methods.
 * 
 * Usage: npm run test:restaurant-sdk-client
 */

import { v4 as uuidv4 } from 'uuid';
import { doorDashRestaurantClient } from '../services/doordash/restaurant-client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Set up test IDs
const businessId = `business-${uuidv4()}`;
const storeId = `store-${uuidv4()}`;

async function testRestaurantClient() {
  console.log('==== DoorDash Restaurant Client Test ====');
  console.log('Using SDK authentication mechanism');
  
  try {
    // Step 1: Create a restaurant business
    console.log('\n1. Creating restaurant business...');
    try {
      const business = await doorDashRestaurantClient.createBusiness({
        external_business_id: businessId,
        name: 'Test Restaurant Business',
      });
      console.log('Created business:', business);
    } catch (error: any) {
      console.error('Error creating business:', error.message);
      
      if (error.response?.data) {
        console.error('Response data:', error.response.data);
      }
      
      if (error.response?.status === 401) {
        console.error('\n❌ Authentication failed (401 Unauthorized)');
        console.error('Please check your DoorDash credentials in the .env file.');
        console.error('Your API key may have expired or be invalid.');
        return;
      }
      throw error;
    }
    
    // Step 2: Create a store for the business
    console.log('\n2. Creating store for business...');
    const store = await doorDashRestaurantClient.createStore({
      external_store_id: storeId,
      external_business_id: businessId,
      name: 'Test Restaurant Location',
      address: {
        street: '901 Market Street',
        city: 'San Francisco',
        state: 'CA',
        zip_code: '94103',
        country: 'US',
      },
      phone_number: '+14155550123',
    });
    console.log('Created store:', store);
    
    // Step 3: Get business details
    console.log('\n3. Getting business details...');
    const businessDetails = await doorDashRestaurantClient.getBusiness(businessId);
    console.log('Business details:', businessDetails);
    
    // Step 4: List businesses
    console.log('\n4. Listing businesses...');
    const businesses = await doorDashRestaurantClient.listBusinesses();
    console.log(`Found ${businesses.businesses.length} businesses`);
    
    console.log('\n==== Test completed successfully ====');
    console.log(`Business ID: ${businessId}`);
    console.log(`Store ID: ${storeId}`);
  } catch (error: any) {
    console.error('Error during test:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testRestaurantClient(); 