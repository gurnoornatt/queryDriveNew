/**
 * Script to check DoorDash authentication issues with Perplexity API
 * 
 * Run with: ts-node src/scripts/check-doordash-auth-perplexity.ts
 */

import dotenv from 'dotenv';
import axios from 'axios';
import { getAuthHeaders } from '../utils/doorDashAuth';

// Load environment variables
dotenv.config();

// DoorDash credentials
const DD_DEVELOPER_ID = process.env.DD_DEVELOPER_ID;
const DD_KEY_ID = process.env.DD_KEY_ID;
const DD_SIGNING_SECRET = process.env.DD_SIGNING_SECRET;

// Perplexity API key
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

if (!PERPLEXITY_API_KEY) {
  console.error('Perplexity API key not found. Make sure PERPLEXITY_API_KEY is set in your .env file.');
  process.exit(1);
}

/**
 * Check if DoorDash credentials are set
 */
const checkDoorDashCredentials = (): boolean => {
  console.log('\n=== DoorDash Credentials Check ===\n');
  
  console.log('DD_DEVELOPER_ID:', DD_DEVELOPER_ID ? '✅ Set' : '❌ Missing');
  console.log('DD_KEY_ID:', DD_KEY_ID ? '✅ Set' : '❌ Missing');
  console.log('DD_SIGNING_SECRET:', DD_SIGNING_SECRET ? '✅ Set' : '❌ Missing');
  
  return !!(DD_DEVELOPER_ID && DD_KEY_ID && DD_SIGNING_SECRET);
};

/**
 * Get authentication help from Perplexity API
 */
const getAuthenticationHelp = async (errorMessage: string): Promise<void> => {
  try {
    console.log('\n=== Consulting Perplexity API for help ===\n');
    console.log('Sending request to Perplexity...');
    
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'sonar-medium-online',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful expert on DoorDash Drive API integration. Provide specific, actionable advice for authentication issues.'
          },
          {
            role: 'user',
            content: `I'm getting a DoorDash Drive API authentication error: "${errorMessage}". 
            I'm using the correct credentials from my developer account. What might be wrong and how can I fix it?
            Is it possible the token expired? How do I refresh it? What are common auth issues with DoorDash API?`
          }
        ],
        temperature: 0.2,
        max_tokens: 1024
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
        }
      }
    );
    
    // Extract and display the advice
    if (response.data.choices && response.data.choices.length > 0) {
      const advice = response.data.choices[0].message.content;
      console.log('\n=== Perplexity API Advice ===\n');
      console.log(advice);
    } else {
      console.log('No useful advice received from Perplexity API.');
    }
    
  } catch (error) {
    console.error('Error contacting Perplexity API:', error);
  }
};

/**
 * Test DoorDash authentication
 */
const testDoorDashAuth = async (): Promise<void> => {
  if (!checkDoorDashCredentials()) {
    console.error('\nDoorDash credentials not fully set. Please check your .env file.');
    return;
  }
  
  console.log('\n=== Testing DoorDash Authentication ===\n');
  
  // Generate auth headers
  const headers = getAuthHeaders('GET', '/deliveries', '');
  console.log('Generated Authentication Headers:');
  console.log(JSON.stringify(headers, null, 2));
  
  try {
    // Attempt to call a simple endpoint
    console.log('\nTesting authentication with a simple API call...');
    
    const response = await axios.get(
      'https://openapi.doordash.com/drive/v2/deliveries',
      { headers }
    );
    
    console.log('\n✅ Authentication successful!');
    console.log(`Response status: ${response.status}`);
    console.log('Sample response data:', JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
    
  } catch (error: any) {
    console.error('\n❌ Authentication failed!');
    
    if (error.response) {
      console.error(`Status code: ${error.response.status}`);
      console.error('Error details:', error.response.data);
      
      // Get help from Perplexity API
      const errorMessage = error.response.data?.message || 'Authentication failed';
      await getAuthenticationHelp(errorMessage);
    } else {
      console.error('Error:', error.message);
      await getAuthenticationHelp(error.message);
    }
  }
};

// Run the test
testDoorDashAuth(); 