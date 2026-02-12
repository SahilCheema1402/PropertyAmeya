"use client"
import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import store from './../../store';
import { useRouter, usePathname } from "next/navigation";


const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    const checkAuth = () => {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      const publicPages = ['/public_pages', '/DeleteAccount', ];
        if (!publicPages.includes(pathname) && (!accessToken || !refreshToken)) {
        router.push('/login');
      }
    };
    checkAuth();

    
    const interval = setInterval(checkAuth, 60000);
    return () => clearInterval(interval); 
  }, [router]);

  return (
    <Provider store={store}>
      {children}
    </Provider>
  );
};

export default StoreProvider;