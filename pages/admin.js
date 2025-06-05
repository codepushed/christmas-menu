import { useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";

const AdminRedirect = () => {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is already authenticated
        const { data } = await supabase.auth.getSession();
        
        if (data && data.session) {
          // User is authenticated, redirect to admin dashboard
          router.replace('/admin/dashboard');
        } else {
          // User is not authenticated, redirect to login
          router.replace('/admin/login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.replace('/admin/login');
      }
    };
    
    checkAuth();
  }, [router]);

  return null;
};

export default AdminRedirect;
