import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Database } from '../types/database';

// Load environment variables
dotenv.config();

// Environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_KEY in .env file.');
}

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Database table names
export const TABLES = {
  DELIVERIES: 'deliveries',
  PROVIDER_QUOTES: 'provider_quotes',
  RESTAURANTS: 'restaurants',
};
