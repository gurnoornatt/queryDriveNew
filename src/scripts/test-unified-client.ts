/**
 * Test script for the unified DoorDash client with fixed authentication
 * 
 * This script tests access to the Restaurant API using our updated authentication mechanism 
 * that properly matches the SDK's JWT format.
 * 
 * Usage: npm run ts-node src/scripts/test-unified-client.ts
 */

import { v4 as uuidv4 } from 'uuid';
import { doorDashRestaurantClient } from '../services/doordash/restaurant-client';
import * as doordashRestaurant from '../clients/doordashRestaurant';
import { doorDashAPI } from '../services/doordash';
import { doorDashSDK } from '../services/doordash-sdk/client';
import dotenv from 'dotenv';

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
const deliveryId = `delivery-${Date.now()}-${uuidv4().slice(0, 8)}`;

async function testUnifiedClient() {
  console.log('==== DoorDash Unified Client Test ====');
  
  try {
    // Step 0: Verify the SDK still works (delivery APIs)
    console.log('\n0. Verifying SDK delivery client works...');
    try {
      const quoteId = `quote-${Date.now()}-${uuidv4().substring(0, 8)}`;
      
      const sdkResponse = await doorDashSDK.getDeliveryQuote({
        external_delivery_id: quoteId,
        pickup_address: "901 Market Street, San Francisco, CA 94103",
        dropoff_address: "901 Market Street, San Francisco, CA 94103",
        pickup_phone_number: "+14155550123",
        pickup_business_name: "Test Business",
        dropoff_phone_number: "+14155550123",
        dropoff_business_name: "Test Customer"
      });
      
      console.log('✅ SDK client works!');
    } catch (error: any) {
      console.error('❌ SDK client failed:', error.message);
      if (error.response?.data) {
        console.error('Response data:', error.response.data);
      }
      console.error('\nSkipping next tests since the SDK auth is failing.');
      return;
    }
    
    // Step 1: Test our updated Restaurant Client
    console.log('\n1. Testing updated Restaurant client...');
    try {
      const business = await doorDashRestaurantClient.createBusiness({
        external_business_id: businessId,
        name: 'Test Restaurant Business'
      });
      
      console.log('✅ Restaurant client works!');
      console.log('Created business:', business);
      
      // Step 2: Get business details
      console.log('\n2. Getting business details with restaurant client...');
      const businessDetails = await doorDashRestaurantClient.getBusiness(businessId);
      console.log('Business details:', businessDetails);
      
      // Step 3: Create a store
      console.log('\n3. Creating store with restaurant client...');
      const store = await doorDashRestaurantClient.createStore({
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
      
      console.log('Created store:', store);
      
    } catch (error: any) {
      console.error('❌ Restaurant client failed:', error.message);
      if (error.response?.data) {
        console.error('Response data:', error.response.data);
      }
      console.error('\nRestaurant client failed, checking if our original client works...');
    }
    
    console.log('\n==== Test complete ====');
    
  } catch (error: any) {
    console.error('Error during test:', error);
  }
}

// Run the test
testUnifiedClient(); 