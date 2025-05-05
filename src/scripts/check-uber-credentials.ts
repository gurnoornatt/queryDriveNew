import * as dotenv from 'dotenv';
import chalk from 'chalk';
import axios from 'axios';

// Load environment variables
dotenv.config();

/**
 * Checks for presence of Uber Direct API credentials in environment
 */
async function checkUberCredentials() {
  console.log('\n=== Uber Direct Credentials Check ===\n');
  
  // Check if credentials are set
  const clientId = process.env.UBER_CLIENT_ID;
  const clientSecret = process.env.UBER_CLIENT_SECRET;
  const customerId = process.env.UBER_CUSTOMER_ID;
  
  const clientIdSet = !!clientId;
  const clientSecretSet = !!clientSecret;
  const customerIdSet = !!customerId;
  
  console.log(`UBER_CLIENT_ID: ${clientIdSet ? '✅ Set' : '❌ Missing'}`);
  console.log(`UBER_CLIENT_SECRET: ${clientSecretSet ? '✅ Set' : '❌ Missing'}`);
  console.log(`UBER_CUSTOMER_ID: ${customerIdSet ? '✅ Set' : '❌ Missing'}`);
  
  if (!clientIdSet || !clientSecretSet || !customerIdSet) {
    console.log('\nMissing required Uber credentials. Please check your .env file.');
    return;
  }
  
  // If all credentials are set, try to get an OAuth token
  console.log('\nTesting authentication with Uber...');
  
  try {
    const response = await axios.post(
      'https://auth.uber.com/oauth/v2/token',
      new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        grant_type: 'client_credentials',
        scope: 'eats.deliveries'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    if (response.data.access_token) {
      console.log('\n✅ Authentication successful! OAuth token received.');
      
      console.log('\n\nSample Authentication Headers:\n');
      console.log({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${response.data.access_token.substring(0, 20)}...`
      });
      
      console.log('\n=== Authentication Recommendations ===\n');
      console.log('If you are getting 401 Unauthorized errors:');
      console.log('1. Check that your credentials are correct in the .env file');
      console.log('2. Verify that your Uber Direct API key has not expired');
      console.log('3. Confirm that your account has access to the Uber Direct API endpoints');
      console.log('4. Ensure the clock on your server is synchronized (for timestamp validation)');
    } else {
      console.log('\n❌ Authentication failed. Response did not include access_token.');
    }
  } catch (error) {
    console.log('\n❌ Authentication failed. Error connecting to Uber API:');
    
    if (axios.isAxiosError(error) && error.response) {
      console.log('\nAPI Error Details:');
      console.log(`Status: ${error.response.status}`);
      console.log(`Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.log(error);
    }
    
    console.log('\n=== Troubleshooting Recommendations ===\n');
    console.log('1. Check your network connection');
    console.log('2. Verify your credentials in the .env file');
    console.log('3. Ensure you have access to the Uber Direct API');
    console.log('4. Check if there are any Uber Direct service outages');
  }
}

// Run the check
checkUberCredentials(); 