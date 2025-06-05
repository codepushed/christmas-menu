// Use the Node.js built-in fs module (only works in API routes, not client-side)
import fs from 'fs/promises';
import path from 'path';
// Import formidable correctly
import { formidable } from 'formidable';

// Disable the default body parser to handle form data
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const method = req.method;

  switch (method) {
    case 'GET':
      try {
        // Get all menus
        const menus = await getMenus();
        res.status(200).json(menus);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;

    case 'POST':
      try {
        // Parse form data
        const { fields, files } = await parseFormData(req);
        
        // Create new menu
        const result = await createMenu(fields.name, files.menuFiles);
        res.status(201).json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;

    case 'PUT':
      try {
        // Parse form data
        const { fields, files } = await parseFormData(req);
        
        // Update menu
        const result = await updateMenu(
          fields.id,
          fields.name,
          fields.slug,
          files.menuFiles || null
        );
        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;

    case 'DELETE':
      try {
        // Parse URL parameters
        const { id, slug } = req.query;
        
        // Delete menu
        await deleteMenu(id, slug);
        res.status(200).json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

// Helper function to parse form data
const parseFormData = (req) => {
  return new Promise((resolve, reject) => {
    const options = {
      multiples: true,
      keepExtensions: true,
    };
    
    const form = formidable(options);
    
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
};

// Get all menus by scanning the menu directories
const getMenus = async () => {
  try {
    const menuBasePath = path.join(process.cwd(), 'public', 'assets', 'menu');
    
    // Check if the directory exists, create if it doesn't
    try {
      await fs.access(menuBasePath);
    } catch (error) {
      await fs.mkdir(menuBasePath, { recursive: true });
      return []; // Return empty array if directory was just created
    }
    
    // Read all menu directories
    const menuDirs = await fs.readdir(menuBasePath, { withFileTypes: true });
    const menus = [];
    
    for (const dir of menuDirs.filter(dirent => dirent.isDirectory())) {
      const menuId = dir.name;
      const menuPath = path.join(menuBasePath, menuId);
      const files = await fs.readdir(menuPath);
      
      // Get menu name from the slug
      const name = menuId
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      const filePaths = files.map(file => `/assets/menu/${menuId}/${file}`);
      
      menus.push({
        id: menuId,
        name,
        slug: menuId,
        filePaths
      });
    }
    
    return menus;
  } catch (error) {
    console.error('Error getting menus:', error);
    throw error;
  }
};

// Create a new menu
const createMenu = async (name, files) => {
  try {
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const menuDirPath = path.join(process.cwd(), 'public', 'assets', 'menu', slug);
    const menuPageDirPath = path.join(process.cwd(), 'pages', 'menu', slug);
    
    // Create directories
    await fs.mkdir(menuDirPath, { recursive: true });
    await fs.mkdir(menuPageDirPath, { recursive: true });
    
    // Process files
    const filePaths = [];
    // Handle array of files or single file object
    const fileArray = Array.isArray(files) ? files : [files];
    
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      if (!file) continue; // Skip if file is undefined
      
      const fileExtension = path.extname(file.originalFilename || '');
      const fileName = `${slug}${i + 1}${fileExtension}`;
      const filePath = path.join(menuDirPath, fileName);
      
      // Read file and write to destination
      const data = await fs.readFile(file.filepath);
      await fs.writeFile(filePath, data);
      
      // Store relative path
      filePaths.push(`/assets/menu/${slug}/${fileName}`);
    }
    
    // Create menu page component
    await createMenuPage(slug, name, filePaths);
    
    return {
      id: slug,
      name,
      slug,
      filePaths
    };
  } catch (error) {
    console.error('Error creating menu:', error);
    throw error;
  }
};

// Update an existing menu
const updateMenu = async (id, name, slug, files = null) => {
  try {
    const menuDirPath = path.join(process.cwd(), 'public', 'assets', 'menu', slug);
    
    let filePaths = [];
    
    // If new files are provided, replace the existing ones
    if (files && files.length > 0) {
      // Delete existing files
      try {
        const existingFiles = await fs.readdir(menuDirPath);
        for (const file of existingFiles) {
          await fs.unlink(path.join(menuDirPath, file));
        }
      } catch (error) {
        // Directory might not exist
        await fs.mkdir(menuDirPath, { recursive: true });
      }
      
      // Process new files
      // Handle array of files or single file object
      const fileArray = Array.isArray(files) ? files : [files];
      
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        if (!file) continue; // Skip if file is undefined
        
        const fileExtension = path.extname(file.originalFilename || '');
        const fileName = `${slug}${i + 1}${fileExtension}`;
        const filePath = path.join(menuDirPath, fileName);
        
        // Read file and write to destination
        const data = await fs.readFile(file.filepath);
        await fs.writeFile(filePath, data);
        
        // Store relative path
        filePaths.push(`/assets/menu/${slug}/${fileName}`);
      }
    } else {
      // Keep existing files
      try {
        const existingFiles = await fs.readdir(menuDirPath);
        filePaths = existingFiles.map(file => `/assets/menu/${slug}/${file}`);
      } catch (error) {
        // Directory might not exist
        console.error('Error reading existing files:', error);
      }
    }
    
    // Update menu page component
    await createMenuPage(slug, name, filePaths);
    
    return {
      id,
      name,
      slug,
      filePaths
    };
  } catch (error) {
    console.error('Error updating menu:', error);
    throw error;
  }
};

// Delete a menu
const deleteMenu = async (id, slug) => {
  try {
    // Delete menu directory
    const menuDirPath = path.join(process.cwd(), 'public', 'assets', 'menu', slug);
    try {
      await fs.rm(menuDirPath, { recursive: true, force: true });
    } catch (error) {
      console.error('Error deleting menu directory:', error);
    }
    
    // Delete menu page
    const menuPageDirPath = path.join(process.cwd(), 'pages', 'menu', slug);
    try {
      await fs.rm(menuPageDirPath, { recursive: true, force: true });
    } catch (error) {
      console.error('Error deleting menu page directory:', error);
    }
  } catch (error) {
    console.error('Error deleting menu:', error);
    throw error;
  }
};

// Create a menu page component
const createMenuPage = async (slug, name, filePaths) => {
  try {
    const componentName = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-([a-z])/g, g => g[1].toUpperCase());
    
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
    
    const pagePath = path.join(process.cwd(), 'pages', 'menu', slug, 'index.jsx');
    await fs.writeFile(pagePath, pageContent);
  } catch (error) {
    console.error('Error creating menu page:', error);
    throw error;
  }
};