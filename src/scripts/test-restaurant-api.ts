/**
 * Test script for DoorDash restaurant API integration
 * 
 * This script demonstrates how to use the DoorDash Drive API for restaurant businesses,
 * including creating businesses, stores, and deliveries from stores.
 * 
 * Usage: npm run ts-node src/scripts/test-restaurant-api.ts
 */

import { v4 as uuidv4 } from 'uuid';
import * as doordashRestaurant from '../clients/doordashRestaurant';
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
  console.error('\nGet these values from your DoorDash Developer Portal.');
  process.exit(1);
}

// Set up test IDs
const businessId = `business-${uuidv4()}`;
const storeId = `store-${uuidv4()}`;
const deliveryId = `delivery-${Date.now()}-${uuidv4().slice(0, 8)}`;

async function testRestaurantAPI() {
  try {
    console.log('==== DoorDash Restaurant API Test ====');
    
    // Step 1: Create a restaurant business
    console.log('\n1. Creating restaurant business...');
    let business;
    try {
      business = await doordashRestaurant.createBusiness({
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
    const store = await doordashRestaurant.createStore({
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
      business_hours: [
        {
          day_of_week: 'monday',
          open_time: '09:00',
          close_time: '22:00',
        },
        {
          day_of_week: 'tuesday',
          open_time: '09:00',
          close_time: '22:00',
        },
        {
          day_of_week: 'wednesday',
          open_time: '09:00',
          close_time: '22:00',
        },
        {
          day_of_week: 'thursday',
          open_time: '09:00',
          close_time: '22:00',
        },
        {
          day_of_week: 'friday',
          open_time: '09:00',
          close_time: '23:00',
        },
        {
          day_of_week: 'saturday',
          open_time: '10:00',
          close_time: '23:00',
        },
        {
          day_of_week: 'sunday',
          open_time: '10:00',
          close_time: '21:00',
        },
      ],
    });
    console.log('Created store:', store);
    
    // Step 3: Get business details
    console.log('\n3. Getting business details...');
    const businessDetails = await doordashRestaurant.getBusiness(businessId);
    console.log('Business details:', businessDetails);
    
    // Step 4: Get store details
    console.log('\n4. Getting store details...');
    const storeDetails = await doordashRestaurant.getStore(businessId, storeId);
    console.log('Store details:', storeDetails);
    
    // Step 5: Update business
    console.log('\n5. Updating business...');
    const updatedBusiness = await doordashRestaurant.updateBusiness({
      external_business_id: businessId,
      name: 'Updated Restaurant Business',
    });
    console.log('Updated business:', updatedBusiness);
    
    // Step 6: Update store
    console.log('\n6. Updating store...');
    const updatedStore = await doordashRestaurant.updateStore({
      external_store_id: storeId,
      external_business_id: businessId,
      name: 'Updated Restaurant Location',
      address: {
        street: '901 Market Street',
        city: 'San Francisco',
        state: 'CA',
        zip_code: '94103',
        country: 'US',
      },
      phone_number: '+14155550123',
    });
    console.log('Updated store:', updatedStore);
    
    // Step 7: Create a delivery from the store
    console.log('\n7. Creating a delivery from the store...');
    const delivery = await doordashRestaurant.createDeliveryFromStore({
      external_delivery_id: deliveryId,
      pickup_external_business_id: businessId,
      pickup_external_store_id: storeId,
      dropoff_address: {
        street: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zip_code: '94105',
        country: 'US',
        unit: '4B',
      },
      dropoff_business_name: 'Test Customer',
      dropoff_phone_number: '+14155551234',
      dropoff_instructions: 'Leave at the front desk',
      items: [
        {
          name: 'Cheeseburger',
          quantity: 2,
          description: 'Double cheeseburger with fries',
          price: 1295, // $12.95 in cents
        },
        {
          name: 'Chicken Sandwich',
          quantity: 1,
          description: 'Spicy chicken sandwich',
          price: 1095, // $10.95 in cents
        },
      ],
      order_value: 3685, // $36.85 in cents
      dropoff_contact_given_name: 'John',
      dropoff_contact_family_name: 'Doe',
      dropoff_contact_send_notifications: true,
      is_catering_order: false,
      contactless_dropoff: true,
    });
    console.log('Created delivery:', delivery);
    
    // Step 8: List businesses
    console.log('\n8. Listing businesses...');
    const businesses = await doordashRestaurant.listBusinesses();
    console.log(`Found ${businesses.length} businesses`);
    
    // Step 9: List stores for the business
    console.log('\n9. Listing stores for business...');
    const stores = await doordashRestaurant.listStores(businessId);
    console.log(`Found ${stores.length} stores for business`);
    
    console.log('\n==== Test completed successfully ====');
    console.log(`Business ID: ${businessId}`);
    console.log(`Store ID: ${storeId}`);
    console.log(`Delivery ID: ${deliveryId}`);
    console.log('\nYou can now go to the DoorDash Developer Portal Simulator');
    console.log('to track and advance this delivery through different statuses.');
    
  } catch (error: any) {
    console.error('Error during restaurant API test:', error);
    
    // Additional error handling
    if (error.response) {
      console.error('\nAPI Response Error:');
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      
      if (error.response.status === 401) {
        console.error('\n❌ Authentication failed (401 Unauthorized)');
        console.error('Please check your DoorDash credentials in the .env file.');
        console.error('Your API key may have expired or be invalid.');
      }
    }
  }
}

// Run the test
testRestaurantAPI(); 