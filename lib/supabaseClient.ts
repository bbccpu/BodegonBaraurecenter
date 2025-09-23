import { createClient } from '@supabase/supabase-js'

// Use import.meta.env for Vite projects to access environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if the variables are defined
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be defined in your .env.local file");
}

// Export the initialized client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
