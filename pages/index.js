import React, { useEffect, useState } from "react";
import Head from "next/head";
import { supabase } from "../lib/supabase";
import styles from '../styles/Login.module.css';

const Home = () => {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const { data, error } = await supabase
          .from('menus')
          .select('*')
          .order('name');

        if (error) {
          setError('Failed to load menus');
          setLoading(false);
          return;
        }

        setMenus(data);
      } catch (err) {
        setError('Failed to load menus');
      } finally {
        setLoading(false);
      }
    };

    fetchMenus();
  }, []);

  return (
    <div>
      <div className="logoContainer">
        <img src="/logo.png" alt="logo" />
      </div>

      <div className="menuSelectors">
        <h1>Our Delectable Menu</h1>
        <p>Indulge in a world of flavors with our extensive menu</p>
      </div>

      <ul>
        {loading ? (
          <li><p style={{ fontSize: "15px", fontWeight: 300 }}>Loading menus...</p></li>
        ) : error ? (
          <li>{error}</li>
        ) : menus.length > 0 ? (
          menus.map((menu) => {
            // Determine the correct URL path based on the slug
            const menuPath = menu.slug === 'caterer' ? '/menu/caterer-menu' : `/menu/${menu.slug}`;

            return (
              <li key={menu.id} style={{ fontSize: "45px" }}>
                <a
                  href={menuPath}
                  target="_blank"
                >
                  {menu.name}
                </a>
              </li>
            );
          })
        ) : (
          <li>No menus available</li>
        )}
      </ul>

      <div className={styles.footer} style={{ position: "absolute", bottom: "0", left: "0", right: "0", textAlign: "center" }}>
        <p className={styles.poweredBy}>Powered by</p>
        <a href="mailto:mehrashubham216@gmail.com" className={styles.brandLink}>
          <h2 className={styles.brandName}>Kwiktable</h2>
        </a>
      </div>

    </div>
  );
};

export default Home;
