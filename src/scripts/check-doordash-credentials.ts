/**
 * Utility script to check DoorDash credentials
 * 
 * Run with: npx ts-node src/scripts/check-doordash-credentials.ts
 */

import dotenv from 'dotenv';
import { getAuthHeaders } from '../utils/doorDashAuth';

// Load environment variables
dotenv.config();

// Check credentials
const DD_DEVELOPER_ID = process.env.DD_DEVELOPER_ID;
const DD_KEY_ID = process.env.DD_KEY_ID;
const DD_SIGNING_SECRET = process.env.DD_SIGNING_SECRET;

console.log('\n=== DoorDash Credentials Check ===\n');

// Check if credentials exist
console.log('DD_DEVELOPER_ID:', DD_DEVELOPER_ID ? '✅ Set' : '❌ Missing');
console.log('DD_KEY_ID:', DD_KEY_ID ? '✅ Set' : '❌ Missing');
console.log('DD_SIGNING_SECRET:', DD_SIGNING_SECRET ? '✅ Set' : '❌ Missing');

console.log('\n');

if (!DD_DEVELOPER_ID || !DD_KEY_ID || !DD_SIGNING_SECRET) {
  console.error('Error: Missing DoorDash credentials. Please check your .env file.');
  console.log(`
To fix this issue:
1. Make sure you have a .env file in the project root
2. Ensure it contains the following variables with valid values:
   DD_DEVELOPER_ID=your_doordash_developer_id
   DD_KEY_ID=your_doordash_key_id
   DD_SIGNING_SECRET=your_doordash_signing_secret
3. Get these values from your DoorDash Developer Portal (https://developer.doordash.com)
4. Make sure your API key has not expired
`);
  process.exit(1);
}

// Generate sample auth headers and print them
console.log('Sample Authentication Headers:\n');
const headers = getAuthHeaders('GET', '/deliveries', '');
console.log(JSON.stringify(headers, null, 2));

console.log('\n=== Authentication Recommendations ===\n');
console.log('If you are getting 401 Unauthorized errors:');
console.log('1. Check that your credentials are correct in the .env file');
console.log('2. Verify that your DoorDash API key has not expired');
console.log('3. Confirm that your account has access to the business API endpoints');
console.log('4. Ensure the clock on your server is synchronized (for timestamp validation)');
console.log('\n'); 