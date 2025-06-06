// Script to create database records for known menu folders
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

// List of known menu folders (from your local menus)
const knownMenuFolders = [
  'alacarte',
  'caterer',
  'christmas',
  'drinks'
];

async function createMenuRecords() {
  try {
    console.log('Creating database records for known menu folders...');
    
    // First, get all existing menus from the database
    const { data: existingMenus, error: menusError } = await supabase
      .from(MENUS_TABLE)
      .select('*');
    
    if (menusError) {
      console.error('Error fetching existing menus:', menusError);
      process.exit(1);
    }
    
    console.log(`Found ${existingMenus ? existingMenus.length : 0} existing menus in database`);
    
    // Process each known menu folder
    for (const slug of knownMenuFolders) {
      console.log(`Processing menu folder: ${slug}`);
      
      // Check if this menu already exists in the database
      if (existingMenus && existingMenus.some(menu => menu.slug === slug)) {
        console.log(`Menu ${slug} already exists in database, skipping`);
        continue;
      }
      
      // Generate public URLs for files in this folder
      // We'll use a pattern based on the folder name since we can't list the files
      const fileUrls = [];
      
      // For each menu type, create appropriate file URLs based on known patterns
      if (slug === 'alacarte') {
        const fileNames = ['alaOne.jpg', 'alaTwo.jpg', 'alaThree.jpg', 'alaFour.jpg', 
                          'alaFive.jpg', 'alaSix.jpg', 'alaSeven.jpg', 'alaEight.jpg'];
        
        for (const fileName of fileNames) {
          const { data } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(`${slug}/${fileName}`);
          fileUrls.push(data.publicUrl);
        }
      } else if (slug === 'caterer') {
        const { data } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(`${slug}/caterer.jpg`);
        fileUrls.push(data.publicUrl);
      } else if (slug === 'christmas') {
        const fileNames = ['christmanOne.jpg', 'christmasTwo.jpg'];
        
        for (const fileName of fileNames) {
          const { data } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(`${slug}/${fileName}`);
          fileUrls.push(data.publicUrl);
        }
      } else if (slug === 'drinks') {
        const fileNames = ['drinksOne.jpg', 'drinksTwo.jpg', 'drinksThree.jpg', 
                          'drinksFour.jpg', 'drinksFive.jpg', 'drinksSix.jpg'];
        
        for (const fileName of fileNames) {
          const { data } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(`${slug}/${fileName}`);
          fileUrls.push(data.publicUrl);
        }
      }
      
      console.log(`Generated ${fileUrls.length} file URLs for menu ${slug}`);
      
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
    
    console.log('Menu record creation completed successfully!');
  } catch (error) {
    console.error('Process failed:', error);
    process.exit(1);
  }
}

// Run the function
createMenuRecords();
