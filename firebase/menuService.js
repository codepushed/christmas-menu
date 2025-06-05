import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from "firebase/storage";
import { db, storage } from "./config";
import { v4 as uuidv4 } from "uuid";

// Collection name for menus in Firestore
const MENUS_COLLECTION = "menus";

/**
 * Get all menus from Firestore
 */
export const getMenus = async () => {
  try {
    const menusSnapshot = await getDocs(collection(db, MENUS_COLLECTION));
    return menusSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting menus:", error);
    throw error;
  }
};

/**
 * Upload files to Firebase Storage
 * @param {File[]} files - Array of files to upload
 * @param {string} menuId - ID of the menu
 * @returns {Promise<string[]>} - Array of download URLs
 */
export const uploadMenuFiles = async (files, menuId) => {
  try {
    const downloadURLs = [];
    
    // Upload files to Firebase Storage
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExtension = file.name.split('.').pop();
      const fileName = `${menuId}${i + 1}.${fileExtension}`;
      const storageRef = ref(storage, `menus/${menuId}/${fileName}`);
      
      // Upload file
      await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      downloadURLs.push(downloadURL);
    }
    
    return downloadURLs;
  } catch (error) {
    console.error("Error uploading menu files:", error);
    throw error;
  }
};

// We don't need to create menu pages dynamically anymore
// Menu pages will be created and managed by Next.js dynamic routes

/**
 * Add a new menu to Firestore
 * @param {string} name - Menu name
 * @param {File[]} files - Array of menu files
 * @returns {Promise<object>} - The created menu object
 */
export const addMenu = async (name, files) => {
  try {
    // Generate a slug for the menu
    const slug = name.toLowerCase().replace(/\s+/g, "-");
    
    // Upload files to Firebase Storage
    const fileUrls = await uploadMenuFiles(files, slug);
    
    // Create menu document in Firestore
    const menuData = {
      name,
      fileUrls,
      createdAt: new Date(),
      updatedAt: new Date(),
      slug
    };
    
    const docRef = await addDoc(collection(db, MENUS_COLLECTION), menuData);
    
    return {
      id: docRef.id,
      ...menuData
    };
  } catch (error) {
    console.error("Error adding menu:", error);
    throw error;
  }
};

/**
 * Update an existing menu
 * @param {string} menuId - ID of the menu to update
 * @param {string} name - New menu name
 * @param {File[]} files - New files (optional)
 * @returns {Promise<object>} - The updated menu object
 */
export const updateMenu = async (menuId, name, files = null) => {
  try {
    const menuRef = doc(db, MENUS_COLLECTION, menuId);
    const menuDoc = await getDoc(menuRef);
    
    if (!menuDoc.exists()) {
      throw new Error(`Menu with ID ${menuId} not found`);
    }
    
    const menuData = menuDoc.data();
    
    // Get the slug from the existing menu data
    const slug = menuData.slug;
    
    // Update data object
    const updateData = {
      name,
      updatedAt: new Date()
    };
    
    // If new files are provided, upload them and update URLs
    if (files && files.length > 0) {
      // Delete existing files from Firebase Storage
      await deleteMenuFiles(slug);
      
      // Upload new files
      const fileUrls = await uploadMenuFiles(files, slug);
      updateData.fileUrls = fileUrls;
    }
    
    // Update the document
    await updateDoc(menuRef, updateData);
    
    // Return the updated menu
    return {
      id: menuId,
      ...menuData,
      ...updateData
    };
  } catch (error) {
    console.error("Error updating menu:", error);
    throw error;
  }
};

/**
 * Delete files from Firebase Storage
 * @param {string} slug - Slug of the menu
 * @returns {Promise<void>}
 */
export const deleteMenuFiles = async (slug) => {
  try {
    const storageRef = ref(storage, `menus/${slug}`);
    
    // List all files in the menu folder
    const filesList = await listAll(storageRef);
    
    // Delete each file
    const deletePromises = filesList.items.map(fileRef => deleteObject(fileRef));
    await Promise.all(deletePromises);
    
  } catch (error) {
    console.error("Error deleting menu files from storage:", error);
    throw error;
  }
};

/**
 * Delete a menu and its files
 * @param {string} menuId - ID of the menu to delete
 * @returns {Promise<void>}
 */
export const deleteMenu = async (menuId) => {
  try {
    // Get the menu data to get the slug
    const menuRef = doc(db, MENUS_COLLECTION, menuId);
    const menuDoc = await getDoc(menuRef);
    
    if (!menuDoc.exists()) {
      throw new Error(`Menu with ID ${menuId} not found`);
    }
    
    const menuData = menuDoc.data();
    const slug = menuData.slug;
    
    // Delete files from Firebase Storage
    await deleteMenuFiles(slug);
    
    // Delete the document from Firestore
    await deleteDoc(menuRef);
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting menu:", error);
    throw error;
  }
};
