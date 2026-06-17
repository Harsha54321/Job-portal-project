// src/ProtectedLayout.jsx
import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import useInactivityLogout from './useInactivityLogout';
import ScrollToTop from './ScrollToTop';

const ProtectedLayout = () => {
  const [isReady, setIsReady] = useState(false);
  
  // This will only run when the component mounts
  useInactivityLogout();
  
  useEffect(() => {
    // Small delay to ensure everything is ready
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (!isReady) {
    return null; // or a loading spinner
  }
  
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
};

export default ProtectedLayout;