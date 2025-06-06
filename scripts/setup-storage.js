// Script to set up Supabase storage bucket and upload a test file
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs').promises;

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lnktdrnuumnbppvbznkr.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxua3Rkcm51dW1uYnBwdmJ6bmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNDEzMjAsImV4cCI6MjA2NDcxNzMyMH0.YwhKnlFa8XTEt9ms_FTCBp8X3ej0hAilL8d588LW3Is';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const STORAGE_BUCKET = 'menu-files';

async function setupStorage() {
  try {
    console.log('Setting up Supabase storage...');
    
    // Check existing buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      process.exit(1);
    }
    
    console.log('Existing buckets:', buckets.map(b => b.name));
    
    // Create bucket if it doesn't exist
    const bucketExists = buckets.some(b => b.name === STORAGE_BUCKET);
    
    if (!bucketExists) {
      console.log(`Creating bucket: ${STORAGE_BUCKET}`);
      
      const { data, error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'],
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (error) {
        console.error('Error creating bucket:', error);
        process.exit(1);
      }
      
      console.log('Bucket created successfully');
    } else {
      console.log(`Bucket ${STORAGE_BUCKET} already exists`);
    }
    
    // Create a test text file
    const testFilePath = path.join(process.cwd(), 'test-menu.txt');
    await fs.writeFile(testFilePath, 'This is a test menu file');
    
    // Upload test file to the christmas folder
    console.log('Uploading test file to christmas folder...');
    
    // First create the folder by uploading a file with the folder path
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload('christmas/test-menu.txt', await fs.readFile(testFilePath), {
        cacheControl: '3600',
        upsert: true,
        contentType: 'text/plain'
      });
    
    if (uploadError) {
      console.error('Error uploading test file:', uploadError);
    } else {
      console.log('Test file uploaded successfully');
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl('christmas/test-menu.txt');
      
      console.log('Public URL:', publicUrlData.publicUrl);
    }
    
    // Clean up the test file
    await fs.unlink(testFilePath);
    
    console.log('Storage setup completed successfully!');
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
setupStorage();
