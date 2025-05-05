/**
 * Simple script to test DoorDash API directly with axios
 * 
 * IMPORTANT: If you're getting "UserAuth token has expired" errors, you need to:
 * 1. Log into the DoorDash Developer Portal
 * 2. Generate new API credentials
 * 3. Update your .env file with the new values
 */

import axios from 'axios';
import dotenv from 'dotenv';
import { getAuthHeaders } from '../utils/doorDashAuth';

// Load environment variables
dotenv.config();

// Define the API endpoint
const API_URL = 'https://openapi.doordash.com/drive/v2';

// Test a simple GET request to /deliveries
async function testGetDeliveries() {
  try {
    console.log('\n=== Testing GET /deliveries ===\n');
    
    // Generate auth headers
    const headers = getAuthHeaders('GET', '/deliveries', '');
    console.log('Using headers:');
    console.log(JSON.stringify(headers, null, 2));
    
    // Make the request
    const response = await axios.get(`${API_URL}/deliveries`, { headers });
    
    console.log('\n=== Response ===\n');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    return true;
  } catch (error: any) {
    console.error('\n=== Error Response ===\n');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
      
      // Check for specific error codes
      if (error.response.status === 401) {
        console.error('\nAuthentication Error (401): Your credentials may be expired or invalid.');
        console.error('Please check your DoorDash Developer Portal and regenerate credentials if needed.');
      } else if (error.response.status === 403) {
        console.error('\nPermission Error (403): You do not have permission to access this endpoint.');
        console.error('Your account may not have access to the business/restaurant API.');
      } else if (error.response.status === 429) {
        console.error('\nRate Limit Error (429): You have exceeded your API rate limit.');
        console.error('Please wait before trying again or contact DoorDash to increase your limit.');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from the server.');
      console.error('This may be a network issue or the API endpoint may be down.');
    } else {
      // Something happened in setting up the request
      console.error('Error during request setup:', error.message);
    }
    
    return false;
  }
}

// Test a simple GET request to /businesses
async function testGetBusinesses() {
  try {
    console.log('\n=== Testing GET /businesses ===\n');
    
    // Generate auth headers
    const headers = getAuthHeaders('GET', '/businesses', '');
    console.log('Using headers:');
    console.log(JSON.stringify(headers, null, 2));
    
    // Make the request
    const response = await axios.get(`${API_URL}/businesses`, { headers });
    
    console.log('\n=== Response ===\n');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    return true;
  } catch (error: any) {
    console.error('\n=== Error Response ===\n');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      
      // Check for specific error codes
      if (error.response.status === 401) {
        console.error('\nAuthentication Error (401): Your credentials may be expired or invalid.');
        console.error('Please check your DoorDash Developer Portal and regenerate credentials if needed.');
      } else if (error.response.status === 403) {
        console.error('\nPermission Error (403): You do not have permission to access this endpoint.');
        console.error('Your account may not have access to the Restaurant API.');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from the server.');
    } else {
      // Something happened in setting up the request
      console.error('Error during request setup:', error.message);
    }
    
    return false;
  }
}

async function diagnoseAuth() {
  console.log('\n====================================');
  console.log('DoorDash API Authentication Diagnosis');
  console.log('====================================\n');
  
  // Check environment variables
  const DD_DEVELOPER_ID = process.env.DD_DEVELOPER_ID;
  const DD_KEY_ID = process.env.DD_KEY_ID;
  const DD_SIGNING_SECRET = process.env.DD_SIGNING_SECRET;
  
  console.log('Checking environment variables:');
  console.log('DD_DEVELOPER_ID:', DD_DEVELOPER_ID ? '✅ Set' : '❌ Missing');
  console.log('DD_KEY_ID:', DD_KEY_ID ? '✅ Set' : '❌ Missing');
  console.log('DD_SIGNING_SECRET:', DD_SIGNING_SECRET ? '✅ Set' : '❌ Missing');
  
  if (!DD_DEVELOPER_ID || !DD_KEY_ID || !DD_SIGNING_SECRET) {
    console.error('\nMissing required environment variables. Please check your .env file.');
    return;
  }
  
  // Test API endpoints
  await testGetDeliveries();
  await testGetBusinesses();
  
  console.log('\n====================================');
  console.log('Diagnosis Complete');
  console.log('====================================\n');
  
  console.log('If all tests failed with 401 errors:');
  console.log('1. Your DoorDash API credentials have expired');
  console.log('2. You need to regenerate them in the DoorDash Developer Portal');
  console.log('3. Update your .env file with the new credentials');
  console.log('\nIf some tests succeeded and others failed:');
  console.log('1. Your account may have partial access to the API');
  console.log('2. Some endpoints may require additional permissions');
  console.log('\nNext steps:');
  console.log('1. Visit https://developer.doordash.com/portal/ to generate new API keys');
  console.log('2. Update your .env file with the new values for:');
  console.log('   DD_DEVELOPER_ID=your_new_developer_id');
  console.log('   DD_KEY_ID=your_new_key_id');
  console.log('   DD_SIGNING_SECRET=your_new_signing_secret');
  console.log('3. Run the test again to verify authentication is working');
}

// Run the diagnosis
diagnoseAuth(); 