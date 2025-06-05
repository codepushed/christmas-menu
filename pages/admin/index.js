import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabase";
import styles from "../../styles/Admin.module.css";

const Admin = () => {
  const router = useRouter();
  const [isDesktop, setIsDesktop] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [newMenuName, setNewMenuName] = useState("");
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check current session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (data && data.session) {
          setIsAuthenticated(true);
        } else {
          // Use replace instead of push to avoid adding to history stack
          router.replace('/admin/login');
        }
      } catch (error) {
        router.replace('/admin/login');
      }
    };
    
    checkAuth();
    
    // Subscribe to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          router.replace('/admin/login');
        } else if (event === 'SIGNED_IN' && session) {
          setIsAuthenticated(true);
        }
      }
    );
    
    return () => {
      // Clean up subscription
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [router]);

  // Check device type
  useEffect(() => {
    const isDesktopDevice = () => {
      const userAgent = navigator.userAgent;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      setIsDesktop(!isMobile);
    };

    isDesktopDevice();
  }, []);

  // Fetch menus
  useEffect(() => {
    const fetchMenus = async () => {
      if (!isAuthenticated) return;
      
      try {
        const response = await fetch('/api/menus');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const menuData = await response.json();
        setMenus(menuData);
      } catch (error) {
        setError("Failed to load menus: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMenus();
  }, [isAuthenticated]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/admin/login');
    } catch (error) {
      console.error('Error logging out:', error.message);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleAddMenu = async (e) => {
    e.preventDefault();
    if (!newMenuName.trim() || files.length === 0) {
      setError("Please provide a menu name and at least one file");
      return;
    }

    try {
      setLoading(true);

      // Create form data for the API request
      const formData = new FormData();
      formData.append('name', newMenuName);

      // Append all files
      for (let i = 0; i < files.length; i++) {
        formData.append('menuFiles', files[i]);
      }

      // Send request to API
      const response = await fetch('/api/menus', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      setMenus([...menus, result]);
      setNewMenuName('');
      setFiles([]);
      setSuccess('Menu added successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(`Failed to add menu: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMenu = (menu) => {
    setSelectedMenu(menu);
  };

  const handleDeleteMenu = async (menuId) => {
    if (!window.confirm('Are you sure you want to delete this menu?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/menus?id=${menuId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Remove the deleted menu from the state
      setMenus(menus.filter(menu => menu.id !== menuId));
      setSuccess('Menu deleted successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(`Failed to delete menu: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMenu.name.trim()) {
      setError("Please provide a menu name");
      return;
    }

    try {
      setLoading(true);

      // Create form data for the API request
      const formData = new FormData();
      formData.append('id', selectedMenu.id);
      formData.append('name', selectedMenu.name);

      // Append new files if any
      if (selectedMenu.newFiles && selectedMenu.newFiles.length > 0) {
        for (let i = 0; i < selectedMenu.newFiles.length; i++) {
          formData.append('menuFiles', selectedMenu.newFiles[i]);
        }
      }

      // Send request to API
      const response = await fetch('/api/menus', {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const updatedMenu = await response.json();
      
      // Update the menu in the state
      setMenus(menus.map(menu => menu.id === updatedMenu.id ? updatedMenu : menu));
      setSelectedMenu(null);
      setSuccess('Menu updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(`Failed to update menu: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isDesktop) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Menus | By Kwiktable</title>
          <meta name="description" content="Kwiktable provide one tap menu creation and ordering experience" />
          <meta name="keywords" content="Menus, Kwiktable, Menu Management, Ordering, Restaurant, Food" />
          <meta name="author" content="Kwiktable" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Kaushan+Script&display=swap" />
        </Head>
        <div className={styles.logoContainer}>
          <img src="/logo.png" alt="logo" />
        </div>

        <div className={styles.mobileMessage}>
          <div className={styles.mobileMessageContent}>
            <h2>Desktop Only</h2>
            <p>We are only accessible on desktop devices. Please find a desktop computer near you to manage your menus.</p>
            <button onClick={() => router.push('/')} className={styles.backButton}>Back to Home</button>
          </div>
        </div>
        
        <div className={styles.footer}>
          <p className={styles.poweredBy}>Powered by</p>
          <a href="mailto:mehrashubham216@gmail.com" className={styles.brandLink}>
            <h2 className={styles.brandName}>Kwiktable</h2>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Menu Admin | Kwiktable</title>
        <meta name="description" content="Kwiktable menu admin panel" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <h1>Menu Admin Panel</h1>
        <div className={styles.headerLinks}>
          <a href="/" className={styles.backLink}>Back to Home</a>
          <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
        </div>
      </header>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.adminContent}>
        <section className={styles.menuList}>
          <h2>Current Menus</h2>
          {loading && !menus.length ? (
            <p>Loading menus...</p>
          ) : menus.length === 0 ? (
            <p>No menus found. Add your first menu below.</p>
          ) : (
            <table className={styles.menuTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {menus.map((menu) => (
                  <tr key={menu.id}>
                    <td>{menu.name}</td>
                    <td>
                      <a href={`/menu/${menu.slug}`} target="_blank" rel="noopener noreferrer">
                        {menu.slug}
                      </a>
                    </td>
                    <td>{new Date(menu.created_at).toLocaleDateString()}</td>
                    <td className={styles.actionButtons}>
                      <button
                        onClick={() => handleUpdateMenu(menu)}
                        className={styles.editButton}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteMenu(menu.id)}
                        className={styles.deleteButton}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {selectedMenu ? (
          <section className={styles.updateMenu}>
            <h2>Update Menu</h2>
            <form onSubmit={handleUpdateSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="updateMenuName">Menu Name:</label>
                <input
                  type="text"
                  id="updateMenuName"
                  value={selectedMenu.name}
                  onChange={(e) => setSelectedMenu({ ...selectedMenu, name: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="updateMenuFiles">Replace Files:</label>
                <input
                  type="file"
                  id="updateMenuFiles"
                  onChange={(e) => {
                    const selectedFiles = Array.from(e.target.files);
                    if (selectedFiles.length > 0) {
                      setSelectedMenu({
                        ...selectedMenu,
                        newFiles: selectedFiles,
                        previewText: `${selectedFiles.length} new file(s) selected`
                      });
                    }
                  }}
                  accept=".jpg,.jpeg,.png,.pdf"
                  multiple
                />
              </div>

              <div className={styles.formActions}>
                <button type="submit" className={styles.saveButton}>Save Changes</button>
                <button
                  type="button"
                  onClick={() => setSelectedMenu(null)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        ) : (
          <section className={styles.addMenu}>
            <h2>Add New Menu</h2>
            <form onSubmit={handleAddMenu}>
              <div className={styles.formGroup}>
                <label htmlFor="newMenuName">Menu Name:</label>
                <input
                  type="text"
                  id="newMenuName"
                  value={newMenuName}
                  onChange={(e) => setNewMenuName(e.target.value)}
                  placeholder="e.g. Summer Special"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="menuFiles">Upload Files:</label>
                <input
                  type="file"
                  id="menuFiles"
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.pdf"
                  multiple
                  required
                />
                <small>Upload JPG, PNG or PDF files. These will be displayed on the menu page.</small>
              </div>

              <div className={styles.filePreview}>
                {files.length > 0 && (
                  <p>{files.length} file(s) selected</p>
                )}
              </div>

              <button type="submit" className={styles.addButton}>Add Menu</button>
            </form>
          </section>
        )}
      </div>
      <div className={styles.footer}>
        <p className={styles.poweredBy}>Powered by</p>
        <a href="mailto:mehrashubham216@gmail.com" className={styles.brandLink}>
          <h2 className={styles.brandName}>Kwiktable</h2>
        </a>
      </div>
    </div>
  );
};

export default Admin;
