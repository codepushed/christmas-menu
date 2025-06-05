import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import styles from '../../styles/Login.module.css';
import LoginGuard from '../../components/LoginGuard';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // LoginGuard component handles the redirect if already logged in

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simple validation
    if (!username || !password) {
      setError('Username and password are required');
      setIsLoading(false);
      return;
    }

    try {
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });
      
      if (error) {
        throw error;
      }
      
      if (data && data.session) {
        // Use replace instead of push to avoid adding to history stack
        router.replace('/admin/dashboard');
      } else {
        setError('Authentication failed');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Admin Login | Kwiktable</title>
        <meta name="description" content="Login to access Kwiktable admin panel" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Kaushan+Script&display=swap" />
      </Head>

      <div className={styles.logoContainer}>
        <img src="/logo.png" alt="Kwiktable Logo" />
      </div>

      <div className={styles.loginBox}>
        <h1>Admin Login</h1>
        
        {error && <div className={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className={styles.loginButton}
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className={styles.helpText}>
          <p>Please use your Supabase account credentials</p>
          <p><a href="/">Return to Home</a></p>
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
};

// Wrap with LoginGuard to prevent authenticated users from seeing login page
const ProtectedLogin = () => (
  <LoginGuard>
    <Login />
  </LoginGuard>
);

export default ProtectedLogin;
