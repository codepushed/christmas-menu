import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for interacting with your database
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lnktdrnuumnbppvbznkr.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxua3Rkcm51dW1uYnBwdmJ6bmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNDEzMjAsImV4cCI6MjA2NDcxNzMyMH0.YwhKnlFa8XTEt9ms_FTCBp8X3ej0hAilL8d588LW3Is';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export { supabase };
