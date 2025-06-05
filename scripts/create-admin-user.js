require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Create a Supabase client with admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lnktdrnuumnbppvbznkr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxua3Rkcm51dW1uYnBwdmJ6bmtyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE0MTMyMCwiZXhwIjoyMDY0NzE3MzIwfQ.RD-rqMArKioZFfE2mSlDtStOBXSKOJ01_h7sJVHI8q4';

if (!supabaseServiceKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY is required to create users');
  console.error('Please add this key to your .env file');
  console.error('You can find this key in your Supabase dashboard under Project Settings > API');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Admin user details - change these as needed
const adminEmail = 'admin@kwiktable.com';
const adminPassword = '29states@kwiktable123';

async function createAdminUser() {
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true
    });

    if (error) {
      console.error('Error creating admin user:', error);
    } else {
      console.log('Admin user created successfully:', data.user.id);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createAdminUser();
