import { doorDashSDK } from '../services/doordash-sdk/client';
import { v4 as uuid } from 'uuid';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Test script for DoorDash SDK using the sandbox environment
 * 
 * This script demonstrates how to:
 * 1. Create a delivery quote
 * 2. Create a delivery
 * 3. Check delivery status
 * 4. Cancel a delivery (if needed)
 * 
 * Run with: npx ts-node src/scripts/test-doordash-sdk.ts
 */

async function testDoorDashSDK() {
  try {
    console.log('Starting DoorDash SDK test...');
    
    // Generate completely unique external IDs for this test
    // Use separate IDs for quote and delivery to avoid potential conflicts
    const timestamp = new Date().getTime();
    const quoteId = `quote-${timestamp}-${uuid().substring(0, 8)}`;
    const deliveryId = `delivery-${timestamp}-${uuid().substring(0, 8)}`;
    
    console.log(`Using quote ID: ${quoteId}`);
    console.log(`Using delivery ID: ${deliveryId}`);

    // DoorDash simulator addresses:
    // - 901 Market Street, San Francisco, CA 94103 (standard successful delivery)
    // - 555 Market Street, San Francisco, CA 94103 (delivery will be returned)
    // - 1 Market Street, San Francisco, CA 94103 (delivery will be canceled)
    // - 720 Market Street, San Francisco, CA 94103 (no available Dashers)
    
    const simulationAddress = "901 Market Street, San Francisco, CA 94103";
    const webhookUrl = "https://646e-138-202-198-238.ngrok-free.app/webhooks/doordash";
    console.log(`Webhook URL (set this in DoorDash Developer Portal): ${webhookUrl}`);

    // Step 1: Create a delivery quote
    console.log('\n1. Creating delivery quote...');
    try {
      const quoteResponse = await doorDashSDK.getDeliveryQuote({
        external_delivery_id: quoteId,
        pickup_address: "901 Market Street, San Francisco, CA 94103",
        dropoff_address: simulationAddress,
        pickup_phone_number: "+12065551212",
        pickup_business_name: "Test Restaurant",
        dropoff_phone_number: "+12065551313",
        dropoff_business_name: "Test Customer",
        pickup_instructions: "Ask for Jane at the counter",
        dropoff_instructions: "Leave at the door"
      });
      console.log('Quote response:', JSON.stringify(quoteResponse.data, null, 2));
    } catch (error) {
      console.error('Error getting quote:', error);
      console.log('Continuing with delivery creation...');
    }

    // Step 2: Create a delivery
    console.log('\n2. Creating delivery...');
    try {
      const deliveryResponse = await doorDashSDK.createDelivery({
        external_delivery_id: deliveryId,
        pickup_address: "901 Market Street, San Francisco, CA 94103",
        dropoff_address: simulationAddress,
        pickup_phone_number: "+12065551212",
        pickup_business_name: "Test Restaurant",
        dropoff_phone_number: "+12065551313",
        dropoff_business_name: "Test Customer",
        pickup_instructions: "Ask for Jane at the counter",
        dropoff_instructions: "Leave at the door",
        order_value: 1500, // $15.00 in cents
        tip: 599 // $5.99 tip in cents - DoorDash requires tip amounts in the lowest currency denomination
        // NOTE: webhook_callback_url needs to be configured in the DoorDash Developer Portal
      });
      console.log('Delivery response:', JSON.stringify(deliveryResponse.data, null, 2));
      
      // If we successfully created the delivery, check its status
      const activeDeliveryId = deliveryId;
      
      // Step 3: Check delivery status
      console.log('\n3. Checking delivery status...');
      const statusResponse = await doorDashSDK.getDeliveryStatus(activeDeliveryId);
      console.log('Status response:', JSON.stringify(statusResponse.data, null, 2));
      
      console.log('\nDoorDash SDK test completed successfully!');
      console.log('\nIMPORTANT: Visit the DoorDash Developer Portal Simulator to advance this delivery through stages.');
      console.log(`External Delivery ID: ${activeDeliveryId}`);
      console.log(`Webhook URL: ${webhookUrl}`);
      
      console.log('\nDoorDash Simulator Instructions:');
      console.log('1. Go to the DoorDash Developer Portal');
      console.log('2. Click on "Simulator" in the left sidebar');
      console.log(`3. Find your delivery with ID: ${activeDeliveryId}`);
      console.log('4. Click "Advance to Next Step" to simulate delivery progress');
      console.log('5. Watch your server logs for webhook events if you\'ve configured webhooks');
      
    } catch (error: any) {
      console.error('Error creating delivery:', error);
      
      if (error.errorCode === 'duplicate_delivery_id') {
        console.log('\nTIP: The DoorDash Sandbox environment may be detecting a duplicate ID.');
        console.log('Try running the script again to generate new IDs.');
      }
    }
  } catch (error: any) {
    console.error('Error in DoorDash SDK test:', error);
    if (error.response) {
      console.error('API Error Response:', error.response.data);
      console.error('Status Code:', error.response.status);
    }
  }
}

// Run the test
testDoorDashSDK(); 