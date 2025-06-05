// Migration script to move local menus to Supabase
const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lnktdrnuumnbppvbznkr.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxua3Rkcm51dW1uYnBwdmJ6bmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNDEzMjAsImV4cCI6MjA2NDcxNzMyMH0.YwhKnlFa8XTEt9ms_FTCBp8X3ej0hAilL8d588LW3Is';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Check if environment variables are set
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('Error: Supabase environment variables are not set.');
  console.log('Please create a .env.local file with the following variables:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
  process.exit(1);
}

async function migrateMenus() {
  try {
    console.log('Starting menu migration to Supabase...');
    
    // Path to local menus
    const menuBasePath = path.join(process.cwd(), 'public', 'assets', 'menu');
    
    // Check if the directory exists
    try {
      await fs.access(menuBasePath);
    } catch (error) {
      console.error(`Error: Menu directory not found at ${menuBasePath}`);
      process.exit(1);
    }
    
    // Read all menu directories
    const menuDirs = await fs.readdir(menuBasePath, { withFileTypes: true });
    const menuFolders = menuDirs.filter(dirent => dirent.isDirectory());
    
    console.log(`Found ${menuFolders.length} menu folders to migrate.`);
    
    // Note: The bucket 'menu-files' should already exist in your Supabase project
    console.log('Using existing storage bucket: menu-files');
    
    // Skip bucket check since user confirmed bucket exists
    console.log('Proceeding with migration...');
    
    for (const dir of menuFolders) {
      const slug = dir.name;
      const menuPath = path.join(menuBasePath, slug);
      const files = await fs.readdir(menuPath);
      
      console.log(`Processing menu: ${slug} (${files.length} files)`);
      
      // Get menu name from the slug
      const name = slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      // Upload files to Supabase Storage
      const fileUrls = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = path.join(menuPath, file);
        const fileData = await fs.readFile(filePath);
        const fileExt = path.extname(file).substring(1);
        const fileName = `${Date.now()}-${i}.${fileExt}`;
        const storagePath = `${slug}/${fileName}`;
        
        console.log(`  Uploading file: ${file} to ${storagePath}`);
        
        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('menu-files')
          .upload(storagePath, fileData, {
            contentType: getContentType(fileExt),
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) {
          console.error(`  Error uploading file ${file}:`, uploadError);
          continue;
        }
        
        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('menu-files')
          .getPublicUrl(storagePath);
        
        fileUrls.push(publicUrlData.publicUrl);
        console.log(`  File uploaded successfully. URL: ${publicUrlData.publicUrl}`);
      }
      
      if (fileUrls.length === 0) {
        console.log(`  No files were successfully uploaded for menu: ${name}. Skipping.`);
        continue;
      }
      
      // Create menu document in Supabase
      const menuData = {
        name,
        slug,
        file_urls: fileUrls,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const { data: menuResult, error: menuError } = await supabase
        .from('menus')
        .insert([menuData])
        .select();
      
      if (menuError) {
        console.error(`  Error creating menu document for ${name}:`, menuError);
        continue;
      }
      
      console.log(`  Menu "${name}" migrated successfully with ID: ${menuResult[0].id}`);
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Helper function to get content type based on file extension
function getContentType(extension) {
  const types = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'pdf': 'application/pdf'
  };
  
  return types[extension.toLowerCase()] || 'application/octet-stream';
}

// Run the migration
migrateMenus();
