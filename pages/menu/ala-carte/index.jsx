import React, { useEffect, useState } from "react";
import Head from "next/head";
import { supabase } from "../../../lib/supabase";

const AlaCarte = () => {
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileUrls, setFileUrls] = useState([]);

  useEffect(() => {
    const fetchMenu = async () => {      
      try {
        const { data, error } = await supabase
          .from('menus')
          .select('*')
          .eq('slug', 'ala-carte')
          .single();
        
        if (error) {
          setError('Menu not found');
          setLoading(false);
          return;
        }
        
        setMenu({
          id: data.id,
          name: data.name,
          slug: data.slug,
          fileUrls: data.file_urls || [],
          createdAt: data.created_at,
          updatedAt: data.updated_at
        });

        // If file_urls exist in the menu data, use them directly
        if (data.file_urls && data.file_urls.length > 0) {
          setFileUrls(data.file_urls);
        } 
        // Otherwise, try to list files from storage
        else {
          const { data: storageData, error: storageError } = await supabase
            .storage
            .from('menu-files')
            .list('alacarte');
          
          if (storageError) {
            console.error('Error listing files from storage:', storageError);
          } else {
            console.log('Files from storage (raw data):', JSON.stringify(storageData, null, 2));
            // Log each file name individually for clarity
            if (storageData && storageData.length > 0) {
              storageData.forEach((file, index) => {
                console.log(`${index}: ${file.name}`);
              });
            }
            
            if (storageData && storageData.length > 0) {
              // Sort files by name to ensure consistent order
              // For timestamp-based filenames like 1749143410375-0.jpg
              const sortedFiles = [...storageData].sort((a, b) => {
                // Try to extract the numeric suffix after the dash
                const suffixA = a.name.split('-')[1];
                const suffixB = b.name.split('-')[1];
                
                if (suffixA && suffixB) {
                  // Extract the number before the file extension
                  const numA = parseInt(suffixA.split('.')[0]);
                  const numB = parseInt(suffixB.split('.')[0]);
                  if (!isNaN(numA) && !isNaN(numB)) {
                    return numA - numB;
                  }
                }
                
                // Fall back to alphabetical sort if the format is different
                return a.name.localeCompare(b.name);
              });
              
              
              // Get public URLs for each file
              const urls = sortedFiles.map(file => {
                const { data: urlData } = supabase
                  .storage
                  .from('menu-files')
                  .getPublicUrl(`alacarte/${file.name}`);
                return urlData.publicUrl;
              });
              
              setFileUrls(urls);
            } else {
              console.log('No files found in storage');
            }
          }
        }
        
      } catch (err) {
        console.error('Error in menu fetch process:', err);
        setError('Failed to load menu');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMenu();
  }, []);

  return (
    <div>
      <Head>
        <title>{menu ? `${menu.name} | By Kwiktable` : 'À La Carte Menu | By Kwiktable'}</title>
        <meta name="description" content={menu ? `${menu.name} menu by Kwiktable` : 'À La Carte menu by Kwiktable'} />
          <meta name="keywords" content="Menus, Kwiktable, Menu Management, Ordering, Restaurant, Food" />
          <meta name="author" content="Kwiktable" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
          <meta property="og:url" content="https://kwiktable.com/seoImgs.png" />
        <meta property="og:image:secure_url" content="https://kwiktable.com/seoImgs.png" />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content="Menus | By Kwiktable" />
        <meta property="twitter:description" content="Kwiktable provide one tap menu creation and ordering experience" />
        <meta property="twitter:image" content="https://kwiktable.com/seoImgs.png" />
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Kaushan+Script&display=swap" />
      </Head>

      <div className="logoContainer">
        <img src="/logo.png" alt="logo" />
      </div>

      {loading ? (
        <div className="loadingContainer">
          <p>Loading menu...</p>
        </div>
      ) : error ? (
        <div className="errorContainer">
          <p>{error}</p>
        </div>
      ) : (
        <div className="menuContainer">
          {/* Use menu.fileUrls if available, otherwise use the fileUrls from storage */}
          {(menu?.fileUrls?.length > 0 ? menu.fileUrls : fileUrls).length > 0 ? (
            (menu?.fileUrls?.length > 0 ? menu.fileUrls : fileUrls).map((url, index) => (
              <img key={index} src={url} alt={`${menu?.name || 'À La Carte'} menu page ${index + 1}`} />
            ))
          ) : (
            <p>No menu images available. Please add menu images in the admin panel.</p>
          )}
        </div>
      )}
      
      <div className="footer">
        <p className="poweredBy" style={{ color: '#fff' }}>Powered by</p>
        <a href="mailto:mehrashubham216@gmail.com" className="brandLink">
          <h2 className="brandName" style={{ color: '#fff' }}>Kwiktable</h2>
        </a>
      </div>

      <style jsx>{`
        .logoContainer {
          text-align: center;
          margin: 2rem 0;
        }
        
        .logoContainer img {
          max-width: 200px;
        }
        
        .menuContainer {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          margin-bottom: 3rem;
        }
        
        .menuContainer img {
          max-width: 100%;
          height: auto;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .footer {
          text-align: center;
          margin: 5rem auto 2rem;
          padding: 2rem 0;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .poweredBy {
          font-size: 12px;
          font-weight: 300;
          color: #fff ;
          opacity: 0.7;
          margin-bottom: 0.5rem;
        }
        
        .brandName {
          font-family: 'Kaushan Script', cursive;
          font-size: 24px;
          color: #fff;
          margin: 0;
        }
        
        .brandLink {
          text-decoration: none;
          transition: transform 0.3s ease;
          display: block;
        }
        
        .brandLink:hover {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
};

export default AlaCarte;
