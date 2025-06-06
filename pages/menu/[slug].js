import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '../../lib/supabase';

const MenuPage = () => {
  const router = useRouter();
  const { slug } = router.query;
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMenu = async () => {
      if (!slug) return;
      
      try {
        // Query Supabase for the menu with this slug
        const { data, error } = await supabase
          .from('menus')
          .select('*')
          .eq('slug', slug)
          .single();
        
        if (error) {
          setError('Menu not found');
          setLoading(false);
          return;
        }
        
        // Transform the data to match our expected format
        setMenu({
          id: data.id,
          name: data.name,
          slug: data.slug,
          fileUrls: data.file_urls,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        });
        
      } catch (err) {
        console.error('Error fetching menu:', err);
        setError('Failed to load menu');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMenu();
  }, [slug]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!menu) return <div>Menu not found</div>;

  return (
    <div>
      <Head>
        <title>{menu.name} | By Kwiktable</title>
          <meta name="description" content="Kwiktable provide one tap menu creation and ordering experience" />
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

      <div className="menuContainer">
        {menu.fileUrls && menu.fileUrls.map((url, index) => (
          <img key={index} src={url} alt={`${menu.name} menu page ${index + 1}`} />
        ))}
      </div>

      <div className="footer">
        <p className="poweredBy">Powered by</p>
        <a href="mailto:mehrashubham216@gmail.com" className="brandLink">
          <h2 className="brandName">Kwiktable</h2>
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
          color: #666;
          opacity: 0.7;
          margin-bottom: 0.5rem;
        }
        
        .brandName {
          font-family: 'Kaushan Script', cursive;
          font-size: 24px;
          color: #333;
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

export default MenuPage;
