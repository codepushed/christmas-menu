import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import styles from "../styles/Admin.module.css";

const Admin = () => {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [newMenuName, setNewMenuName] = useState("");
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load menus from API
  useEffect(() => {
    const fetchMenus = async () => {
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
  }, []);

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

      const newMenu = await response.json();
      setMenus([...menus, newMenu]);
      setNewMenuName("");
      setFiles([]);
      setSuccess(`Menu "${newMenuName}" added successfully!`);
    } catch (error) {
      setError("Failed to add menu: " + error.message);
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  const handleUpdateMenu = (menu) => {
    setSelectedMenu(menu);
  };

  const handleDeleteMenu = async (menuId) => {
    if (window.confirm("Are you sure you want to delete this menu?")) {
      try {
        setLoading(true);
        const menuToDelete = menus.find(menu => menu.id === menuId);

        // Send delete request to API
        const response = await fetch(`/api/menus?id=${menuId}&slug=${menuToDelete.slug}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        setMenus(menus.filter(menu => menu.id !== menuId));
        setSuccess("Menu deleted successfully!");
      } catch (error) {
        setError("Failed to delete menu: " + error.message);
      } finally {
        setLoading(false);
        setTimeout(() => setSuccess(""), 3000);
      }
    }
  };

  const handleSaveUpdate = async (e) => {
    e.preventDefault();
    if (!selectedMenu.name.trim()) {
      setError("Menu name cannot be empty");
      return;
    }

    try {
      setLoading(true);

      // Create form data for the API request
      const formData = new FormData();
      formData.append('id', selectedMenu.id);
      formData.append('name', selectedMenu.name);
      formData.append('slug', selectedMenu.slug);

      // Append files if any
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

      const updatedMenus = menus.map(menu =>
        menu.id === selectedMenu.id ? { ...menu, ...updatedMenu } : menu
      );

      setMenus(updatedMenus);
      setSelectedMenu(null);
      setSuccess("Menu updated successfully!");
    } catch (error) {
      setError("Failed to update menu: " + error.message);
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Menus | By Kwiktable</title>
        <meta name="description" content="Admin page for menu management by Kwiktable" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Kaushan+Script&display=swap" />
      </Head>
      <div className={styles.logoContainer}>
        <img src="/logo.png" alt="logo" />
      </div>

      <header className={styles.header}>
        <h1>Menu Admin Panel</h1>
        <a href="/" className={styles.homeLink}>Back to Home</a>
      </header>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.adminContent}>
        <section className={styles.menuList}>
          <h2>Current Menus</h2>
          {loading ? (
            <p>Loading menus...</p>
          ) : (
            <table className={styles.menuTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Preview</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {menus.map((menu) => (
                  <tr key={menu.id}>
                    <td>{menu.name}</td>
                    <td>
                      {menu.filePaths && menu.filePaths.length > 0 ? (
                        menu.filePaths.length > 1 ? (
                          <span>{menu.filePaths.length} files</span>
                        ) : (
                          <img
                            src={menu.filePaths[0]}
                            alt={menu.name}
                            className={styles.menuPreview}
                          />
                        )
                      ) : (
                        <span>No files</span>
                      )}
                    </td>
                    <td>
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
            <form onSubmit={handleSaveUpdate}>
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
