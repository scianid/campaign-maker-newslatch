// Simple Supabase connection test
// You can run this in your browser console to test the connection

import { supabase } from './lib/supabase.js';

// Test function to check Supabase connection
export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test 1: Check if we can connect to Supabase
    const { data, error } = await supabase.from('campaigns').select('count');
    
    if (error) {
      console.error('Connection Error:', error);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
}

// Run the test
testSupabaseConnection();