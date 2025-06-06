import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from command-line arguments
const args = process.argv.slice(2);
let supabaseUrl, supabaseKey;

if (args.length >= 2) {
  supabaseUrl = args[0];
  supabaseKey = args[1];
} else {
  console.error('Usage: node update-menu-file-urls.js <SUPABASE_URL> <SUPABASE_ANON_KEY>');
  console.error('Example: node update-menu-file-urls.js https://your-project.supabase.co your-anon-key');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Define the known file names for each menu
const menuFiles = {
  'alacarte': [
    '1749143402091-0.jpg',
    '1749143404032-1.jpg',
    '1749143404841-2.jpg',
    '1749143405353-3.jpg',
    '1749143406635-4.jpg',
    '1749143407402-5.jpg',
    '1749143407911-6.jpg',
    '1749143408833-7.jpg'
  ],
  'christmas': [
    '1749143409654-0.jpg',
    '1749143410375-1.jpg'
  ],
  'drinks': [
    '1749143411095-0.jpg',
    '1749143411815-1.jpg',
    '1749143412535-2.jpg',
    '1749143413255-3.jpg',
    '1749143413975-4.jpg',
    '1749143414695-5.jpg'
  ]
};

async function updateMenuFileUrls() {
  try {
    // Get all menus
    const { data: menus, error: menusError } = await supabase
      .from('menus')
      .select('*');
    
    if (menusError) {
      throw menusError;
    }
    
    console.log(`Found ${menus.length} menus to update`);
    
    // Process each menu
    for (const menu of menus) {
      console.log(`\nProcessing menu: ${menu.name} (${menu.slug})`);
      
      // Skip if we don't have predefined files for this menu
      if (!menuFiles[menu.slug]) {
        console.log(`No predefined files for ${menu.slug}, skipping...`);
        continue;
      }
      
      // Generate public URLs for each file
      const fileUrls = menuFiles[menu.slug].map(fileName => {
        const { data: urlData } = supabase
          .storage
          .from('menu-files')
          .getPublicUrl(`${menu.slug}/${fileName}`);
        return urlData.publicUrl;
      });
      
      console.log(`Generated ${fileUrls.length} file URLs for ${menu.slug}`);
      if (fileUrls.length > 0) {
        console.log('First URL:', fileUrls[0]);
        console.log('Last URL:', fileUrls[fileUrls.length - 1]);
      }
      
      // Update the menu record with the new file_urls
      const { error: updateError } = await supabase
        .from('menus')
        .update({ file_urls: fileUrls })
        .eq('id', menu.id);
      
      if (updateError) {
        console.error(`Error updating file_urls for ${menu.slug}:`, updateError);
      } else {
        console.log(`Successfully updated file_urls for ${menu.slug}`);
      }
    }
    
    console.log('\nAll menus have been updated!');
    
  } catch (error) {
    console.error('Error updating menu file URLs:', error);
  }
}

// Run the update function
updateMenuFileUrls();
