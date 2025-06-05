import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "./config";
import { v4 as uuidv4 } from "uuid";
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';

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
 * Save files to the public directory and create menu page
 * @param {File[]} files - Array of files to upload
 * @param {string} menuId - ID of the menu
 * @param {string} menuName - Name of the menu
 * @returns {Promise<string[]>} - Array of file paths
 */
export const saveMenuFiles = async (files, menuId, menuName) => {
  try {
    // Create directory structure if it doesn't exist
    const menuDirPath = path.join(process.cwd(), 'public', 'assets', 'menu', menuId);
    const menuPageDirPath = path.join(process.cwd(), 'pages', 'menu', menuId);
    
    // Ensure directories exist
    await fsPromises.mkdir(menuDirPath, { recursive: true });
    await fsPromises.mkdir(menuPageDirPath, { recursive: true });
    
    const filePaths = [];
    
    // Save files to public directory
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExtension = file.name.split('.').pop();
      const fileName = `${menuId}${i + 1}.${fileExtension}`;
      const filePath = path.join(menuDirPath, fileName);
      
      // Save file to disk
      await fsPromises.writeFile(filePath, file.buffer);
      
      // Store relative path for database
      filePaths.push(`/assets/menu/${menuId}/${fileName}`);
    }
    
    // Create menu page component
    await createMenuPage(menuId, menuName, filePaths);
    
    return filePaths;
  } catch (error) {
    console.error("Error saving menu files:", error);
    throw error;
  }
};

/**
 * Create a menu page component
 * @param {string} menuId - ID of the menu
 * @param {string} menuName - Name of the menu
 * @param {string[]} filePaths - Array of file paths
 */
export const createMenuPage = async (menuId, menuName, filePaths) => {
  try {
    const componentName = menuId.charAt(0).toUpperCase() + menuId.slice(1).replace(/-([a-z])/g, g => g[1].toUpperCase());
    
    const imageElements = filePaths.map(path => `        <img src="${path}" alt="menu" />\n`).join('');
    
    const pageContent = `import React from "react";

const ${componentName} = () => {
  return (
    <div>
      <div className="logoContainer">
        <img src="/logo.png" alt="logo" />
      </div>

      <div className="menuContainer">
${imageElements}      </div>
    </div>
  );
};

export default ${componentName};
`;
    
    const pagePath = path.join(process.cwd(), 'pages', 'menu', menuId, 'index.jsx');
    await fsPromises.writeFile(pagePath, pageContent);
    
  } catch (error) {
    console.error("Error creating menu page:", error);
    throw error;
  }
};

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
    
    // Save files to public directory and create menu page
    const filePaths = await saveMenuFiles(files, slug, name);
    
    // Create menu document in Firestore
    const menuData = {
      name,
      filePaths,
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
    const menuData = menuDoc.data();
    
    // Get the slug from the existing menu data
    const slug = menuData.slug;
    
    // Update data object
    const updateData = {
      name,
      updatedAt: new Date()
    };
    
    // If new files are provided, save them and update paths
    if (files && files.length > 0) {
      // Delete existing files if needed
      // This would require additional implementation
      
      // Save new files
      const filePaths = await saveMenuFiles(files, slug, name);
      updateData.filePaths = filePaths;
      
      // Update the menu page
      await createMenuPage(slug, name, filePaths);
    }
    
    // Update the document
    await updateDoc(menuRef, updateData);
    
    // Return the updated menu
    return {
      id: menuId,
      ...updateData
    };
  } catch (error) {
    console.error("Error updating menu:", error);
    throw error;
  }
};

/**
 * Delete a menu and its files
 * @param {string} menuId - ID of the menu to delete
 * @param {string} slug - Slug of the menu
 * @param {string[]} filePaths - Paths of files to delete
 * @returns {Promise<void>}
 */
export const deleteMenu = async (menuId, slug, filePaths) => {
  try {
    // Delete the document from Firestore
    await deleteDoc(doc(db, MENUS_COLLECTION, menuId));
    
    // Delete files from public directory
    const menuDirPath = path.join(process.cwd(), 'public', 'assets', 'menu', slug);
    try {
      await fsPromises.rm(menuDirPath, { recursive: true, force: true });
    } catch (fileError) {
      console.error("Error deleting menu directory:", fileError);
    }
    
    // Delete menu page
    const menuPageDirPath = path.join(process.cwd(), 'pages', 'menu', slug);
    try {
      await fsPromises.rm(menuPageDirPath, { recursive: true, force: true });
    } catch (pageError) {
      console.error("Error deleting menu page directory:", pageError);
    }
  } catch (error) {
    console.error("Error deleting menu:", error);
    throw error;
  }
};
