import { formidable } from 'formidable';
import { addMenu, getMenus, updateMenu, deleteMenu } from '../../lib/menuService';

// Make sure service role key is available in the environment
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY is not defined in the environment. Some operations may fail due to RLS policies.');
}

// Disable the default body parser to handle form data
export const config = {
  api: {
    bodyParser: false,
  },
};

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

export default async function handler(req, res) {
  const method = req.method;

  switch (method) {
    case 'GET':
      try {
        // Get all menus using Supabase service
        const menus = await getMenus();
        res.status(200).json(menus);
      } catch (error) {
        console.error('Error getting menus:', error);
        res.status(500).json({ error: error.message });
      }
      break;

    case 'POST':
      try {
        // Parse form data
        const { fields, files } = await parseFormData(req);
        
        // Create new menu using Supabase service
        const result = await addMenu(fields.name, files.menuFiles);
        res.status(201).json(result);
      } catch (error) {
        console.error('Error creating menu:', error);
        res.status(500).json({ error: error.message });
      }
      break;

    case 'PUT':
      try {
        // Parse form data
        const { fields, files } = await parseFormData(req);
        
        // Update menu using Supabase service
        const result = await updateMenu(
          fields.id,
          fields.name,
          files.menuFiles || null
        );
        res.status(200).json(result);
      } catch (error) {
        console.error('Error updating menu:', error);
        res.status(500).json({ error: error.message });
      }
      break;

    case 'DELETE':
      try {
        // Parse URL parameters
        const { id } = req.query;
        
        // Delete menu using Supabase service
        await deleteMenu(id);
        res.status(200).json({ success: true });
      } catch (error) {
        console.error('Error deleting menu:', error);
        res.status(500).json({ error: error.message });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}