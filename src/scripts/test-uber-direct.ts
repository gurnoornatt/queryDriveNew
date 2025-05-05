import * as uberClient from '../clients/uber';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

async function testUberDirectAPI() {
  console.log('Starting Uber Direct API test...');
  
  // Generate unique IDs for this test run
  const testId = Date.now().toString();
  const quoteId = `quote-${testId}-${uuidv4().substring(0, 8)}`;
  const deliveryId = `delivery-${testId}-${uuidv4().substring(0, 8)}`;
  
  try {
    // 1. Test authentication
    console.log('\n1. Testing authentication...');
    const token = await uberClient.getAuthToken();
    console.log('Authentication successful! Token received.');
    
    // 2. Create a delivery quote
    console.log('\n2. Creating delivery quote...');
    const quoteRequest: uberClient.UberQuoteRequest = {
      pickup_address: JSON.stringify({
        street_address: ["901 Market St", "Floor 6"],
        state: "CA",
        city: "San Francisco",
        zip_code: "94103",
        country: "US"
      }),
      dropoff_address: JSON.stringify({
        street_address: ["901 Market St", "Floor 6"],
        state: "CA",
        city: "San Francisco",
        zip_code: "94103",
        country: "US"
      }),
      pickup_latitude: 37.783688,
      pickup_longitude: -122.40832,
      dropoff_latitude: 37.783688,
      dropoff_longitude: -122.40832
    };
    
    const quoteResponse = await uberClient.getQuote(quoteRequest);
    console.log('Quote response:', JSON.stringify(quoteResponse, null, 2));
    
    // Save the quote ID for the delivery request
    const savedQuoteId = quoteResponse.id;
    
    // 3. Create a delivery
    console.log('\n3. Creating delivery...');
    const deliveryRequest: uberClient.UberDeliveryRequest = {
      quote_id: savedQuoteId,
      pickup_address: JSON.stringify({
        street_address: ["901 Market St", "Floor 6"],
        state: "CA",
        city: "San Francisco",
        zip_code: "94103",
        country: "US"
      }),
      pickup_name: "Test Restaurant",
      pickup_phone_number: "+12065551212",
      pickup_latitude: 37.783688,
      pickup_longitude: -122.40832,
      dropoff_address: JSON.stringify({
        street_address: ["901 Market St", "Floor 6"],
        state: "CA",
        city: "San Francisco",
        zip_code: "94103",
        country: "US"
      }),
      dropoff_name: "Test Customer",
      dropoff_phone_number: "+12065551313",
      dropoff_latitude: 37.783688,
      dropoff_longitude: -122.40832,
      manifest_items: [
        {
          name: "Test Item",
          quantity: 1,
          weight: 30,
          dimensions: {
            length: 40,
            height: 40,
            depth: 40
          }
        }
      ]
    };
    
    const deliveryResponse = await uberClient.createDelivery(deliveryRequest);
    console.log('Delivery response:', JSON.stringify(deliveryResponse, null, 2));
    
    // Save the delivery ID for status check
    const deliveryId = deliveryResponse.id;
    
    // 4. Check delivery status
    console.log('\n4. Checking delivery status...');
    const statusResponse = await uberClient.getDeliveryStatus(deliveryId);
    console.log('Status response:', JSON.stringify(statusResponse, null, 2));
    
    console.log('\nUber Direct API test completed successfully!');
    console.log('\nIMPORTANT: Visit the Uber Direct Dashboard to track this delivery.');
    console.log(`Delivery ID: ${deliveryId}`);
    console.log(`Tracking URL: ${deliveryResponse.tracking_url}`);
    
  } catch (error) {
    console.error('Error testing Uber Direct API:', error);
    process.exit(1);
  }
}

// Run the test
testUberDirectAPI(); 