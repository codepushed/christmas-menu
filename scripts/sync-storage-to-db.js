// Script to sync Supabase Storage menus with the database
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lnktdrnuumnbppvbznkr.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxua3Rkcm51dW1uYnBwdmJ6bmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNDEzMjAsImV4cCI6MjA2NDcxNzMyMH0.YwhKnlFa8XTEt9ms_FTCBp8X3ej0hAilL8d588LW3Is';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const MENUS_TABLE = 'menus';
const STORAGE_BUCKET = 'menu-files';

async function syncStorageToDb() {
  try {
    console.log('Starting sync of Supabase Storage menus to database...');
    
    // First, get all existing menus from the database
    const { data: existingMenus, error: menusError } = await supabase
      .from(MENUS_TABLE)
      .select('*');
    
    if (menusError) {
      console.error('Error fetching existing menus:', menusError);
      process.exit(1);
    }
    
    console.log(`Found ${existingMenus ? existingMenus.length : 0} existing menus in database`);
    
    // Now list all buckets to make sure our bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      process.exit(1);
    }
    
    console.log('Available buckets:', buckets.map(b => b.name));
    
    // Check if our bucket exists
    if (!buckets.some(b => b.name === STORAGE_BUCKET)) {
      console.error(`Bucket ${STORAGE_BUCKET} does not exist`);
      process.exit(1);
    }
    
    // Get the root contents of our bucket
    const { data: rootItems, error: rootError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list('', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (rootError) {
      console.error('Error listing bucket contents:', rootError);
      process.exit(1);
    }
    
    console.log('Root items in bucket:', rootItems);
    
    // Get all folders (these are our menus)
    // In Supabase Storage, folders are represented as items with no file extension
    const menuFolders = rootItems.filter(item => item.id && !item.name.includes('.'));
    
    // If no folders found, try to get all items that might be folders
    if (menuFolders.length === 0) {
      console.log('No folders found in root, trying to list all items...');
      
      // Get a list of all possible menu folders by checking what's in the storage
      // This is a workaround for Supabase Storage API limitations
      const { data: allItems, error: allItemsError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list('', { limit: 1000 });
      
      if (allItemsError) {
        console.error('Error listing all items:', allItemsError);
      } else {
        console.log('All items found:', allItems);
        
        // Try to extract folder names from item paths
        const folderNames = new Set();
        allItems.forEach(item => {
          if (item.name && item.name.includes('/')) {
            const folderName = item.name.split('/')[0];
            folderNames.add(folderName);
          }
        });
        
        console.log('Extracted folder names:', Array.from(folderNames));
        
        // Create menu folder objects from folder names
        Array.from(folderNames).forEach(name => {
          menuFolders.push({ name });
        });
      }
    }
    
    console.log(`Found ${menuFolders.length} menu folders in storage`);
    
    // Process each menu folder
    for (const folder of menuFolders) {
      const slug = folder.name;
      console.log(`Processing menu folder: ${slug}`);
      
      // Check if this menu already exists in the database
      const { data: existingMenu, error: checkError } = await supabase
        .from(MENUS_TABLE)
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is 'no rows returned' which is fine
        console.error(`Error checking if menu ${slug} exists:`, checkError);
        continue;
      }
      
      if (existingMenu) {
        console.log(`Menu ${slug} already exists in database, skipping`);
        continue;
      }
      
      // List files in this folder
      const { data: files, error: filesError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list(slug, {
          limit: 100,
          sortBy: { column: 'name', order: 'asc' }
        });
      
      if (filesError) {
        console.error(`Error listing files for menu ${slug}:`, filesError);
        continue;
      }
      
      // If no files found, try a different approach - search for files with this prefix
      let fileUrls = [];
      if (!files || files.length === 0) {
        console.log(`No files found directly in folder ${slug}, trying to search for files with this prefix...`);
        
        // Search for all files in the bucket
        const { data: allFiles, error: allFilesError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .list('', { limit: 1000 });
        
        if (allFilesError) {
          console.error(`Error searching for files with prefix ${slug}:`, allFilesError);
          continue;
        }
        
        // Filter files that belong to this menu folder
        const menuFiles = allFiles.filter(file => 
          file.name && file.name.startsWith(`${slug}/`) && file.name.includes('.')
        );
        
        console.log(`Found ${menuFiles.length} files with prefix ${slug}/`);
        
        if (menuFiles.length === 0) {
          console.log(`No files found for menu ${slug}, skipping`);
          continue;
        }
        
        // Get public URLs for these files
        fileUrls = menuFiles.map(file => {
          const { data } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(file.name);
          return data.publicUrl;
        });
      } else {
        // Get public URLs for all files found directly in the folder
        console.log(`Found ${files.length} files for menu ${slug}`);
        
        fileUrls = files.map(file => {
          const { data } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(`${slug}/${file.name}`);
          return data.publicUrl;
        });
      }
      
      // Create menu record in database
      const menuName = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      const menuData = {
        name: menuName,
        slug: slug,
        file_urls: fileUrls
      };
      
      const { data: newMenu, error: insertError } = await supabase
        .from(MENUS_TABLE)
        .insert([menuData])
        .select();
      
      if (insertError) {
        console.error(`Error creating menu record for ${slug}:`, insertError);
      } else {
        console.log(`Created menu record for ${slug} with ${fileUrls.length} files`);
      }
    }
    
    console.log('Sync completed successfully!');
  } catch (error) {
    console.error('Sync failed:', error);
    process.exit(1);
  }
}

// Run the sync
syncStorageToDb();
