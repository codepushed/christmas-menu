import { supabase, supabaseAdmin } from './supabase';
import { v4 as uuidv4 } from 'uuid';

const MENUS_TABLE = 'menus';
const STORAGE_BUCKET = 'menu-files';

/**
 * Get all menus from the database
 */
export const getMenus = async () => {
  try {
    console.log('Fetching menus from table:', MENUS_TABLE);
    
    // Get all menus with a simpler query
    const { data, error } = await supabase
      .from(MENUS_TABLE)
      .select('*');
    
    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }
    
    console.log('Fetched menus data:', data);
    
    // If no menus found, let's create a test menu
    if (!data || data.length === 0) {
      console.log('No menus found, creating a test menu');
      
      const testMenu = {
        name: 'Test Menu',
        slug: 'test-menu',
        file_urls: [],
      };
      
      const { data: newMenu, error: insertError } = await supabase
        .from(MENUS_TABLE)
        .insert([testMenu])
        .select();
      
      if (insertError) {
        console.error('Error creating test menu:', insertError);
      } else {
        console.log('Created test menu:', newMenu);
        return newMenu;
      }
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching menus:", error);
    throw error;
  }
};

/**
 * Get a specific menu by slug
 */
export const getMenuBySlug = async (slug) => {
  try {
    const { data, error } = await supabase
      .from(MENUS_TABLE)
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching menu with slug ${slug}:`, error);
    throw error;
  }
};

/**
 * Upload menu files to Supabase Storage
 */
const uploadMenuFiles = async (files, slug) => {
  const fileUrls = [];
  
  // Handle case when files is an array of formidable File objects
  const filesArray = Array.isArray(files) ? files : [files];
  
  for (const file of filesArray) {
    try {
      console.log('Processing file:', file.originalFilename || file.name);
      
      // Get file extension - handle both formidable files and regular File objects
      const fileName = file.originalFilename || file.name;
      const fileExt = fileName.split('.').pop();
      const newFileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${slug}/${newFileName}`;
      
      // For formidable File objects, we need to read the file from the filepath
      const fileContent = file.filepath ? 
        await require('fs').promises.readFile(file.filepath) : 
        file;
      
      console.log(`Uploading file to ${STORAGE_BUCKET}/${filePath}`);
      
      // Use supabaseAdmin for storage operations to bypass RLS
      const client = supabaseAdmin || supabase;
      console.log('Using admin client for storage upload:', !!supabaseAdmin);
      
      // Upload file to Supabase Storage
      const { data, error } = await client.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, fileContent, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.mimetype || 'application/octet-stream'
        });
      
      if (error) {
        console.error('Error uploading file:', error);
        throw error;
      }
      
      console.log('File uploaded successfully:', filePath);
      
      // Get public URL
      const { data: publicUrlData } = client.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);
      
      console.log('Generated public URL:', publicUrlData.publicUrl);
      fileUrls.push(publicUrlData.publicUrl);
    } catch (err) {
      console.error('Error processing file:', err);
      throw err;
    }
  }
  
  return fileUrls;
};

/**
 * Delete menu files from Supabase Storage
 */
const deleteMenuFiles = async (slug) => {
  try {
    // Use admin client for storage operations
    const client = supabaseAdmin || supabase;
    
    // List all files in the menu's folder
    const { data: fileList, error: listError } = await client.storage
      .from(STORAGE_BUCKET)
      .list(slug);
    
    if (listError) throw listError;
    
    if (fileList && fileList.length > 0) {
      // Create an array of file paths to delete
      const filesToDelete = fileList.map(file => `${slug}/${file.name}`);
      
      // Delete all files
      const { error: deleteError } = await client.storage
        .from(STORAGE_BUCKET)
        .remove(filesToDelete);
      
      if (deleteError) throw deleteError;
    }
  } catch (error) {
    console.error(`Error deleting files for menu ${slug}:`, error);
    throw error;
  }
};

/**
 * Create a slug from a name
 */
const createSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-');     // Replace multiple hyphens with single hyphen
};

/**
 * Add a new menu
 */
export const addMenu = async (name, files) => {
  try {
    // Create a slug from the name
    const slug = createSlug(name);
    
    // Upload files to storage
    const fileUrls = await uploadMenuFiles(files, slug);
    
    // Create menu record in database
    const menuData = {
      name,
      slug,
      file_urls: fileUrls,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // Use admin client for database operations that need to bypass RLS
    const client = supabaseAdmin || supabase;
    console.log('Using admin client for database insert:', !!supabaseAdmin);
    
    const { data, error } = await client
      .from(MENUS_TABLE)
      .insert([menuData])
      .select();
    
    if (error) throw error;
    
    return {
      id: data[0].id,
      name: data[0].name,
      slug: data[0].slug,
      fileUrls: data[0].file_urls,
      createdAt: data[0].created_at,
      updatedAt: data[0].updated_at
    };
  } catch (error) {
    console.error("Error adding menu:", error);
    throw error;
  }
};

/**
 * Update an existing menu
 */
export const updateMenu = async (id, name, files) => {
  try {
    // Get the existing menu
    const { data: existingMenu, error: fetchError } = await supabase
      .from(MENUS_TABLE)
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Update data object
    const updateData = {
      name,
      updated_at: new Date()
    };
    
    // If new files are provided, upload them and update URLs
    if (files && files.length > 0) {
      // Delete existing files
      await deleteMenuFiles(existingMenu.slug);
      
      // Upload new files
      const fileUrls = await uploadMenuFiles(files, existingMenu.slug);
      updateData.file_urls = fileUrls;
    }
    
    // Use admin client for database operations that need to bypass RLS
    const client = supabaseAdmin || supabase;
    console.log('Using admin client for database update:', !!supabaseAdmin);
    
    // Update the record
    const { data, error } = await client
      .from(MENUS_TABLE)
      .update(updateData)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    return {
      id: data[0].id,
      name: data[0].name,
      slug: data[0].slug,
      fileUrls: data[0].file_urls,
      createdAt: data[0].created_at,
      updatedAt: data[0].updated_at
    };
  } catch (error) {
    console.error("Error updating menu:", error);
    throw error;
  }
};

/**
 * Delete a menu
 */
export const deleteMenu = async (id) => {
  try {
    // Get the menu to delete
    const { data: menuToDelete, error: fetchError } = await supabase
      .from(MENUS_TABLE)
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Delete files from storage
    await deleteMenuFiles(menuToDelete.slug);
    
    // Use admin client for database operations that need to bypass RLS
    const client = supabaseAdmin || supabase;
    console.log('Using admin client for database delete:', !!supabaseAdmin);
    
    // Delete the menu record
    const { error } = await client
      .from(MENUS_TABLE)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting menu:", error);
    throw error;
  }
};
