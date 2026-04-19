'use client';

// Conditional Footer component that hides on specific pages
// Used to provide clean, full-screen experience on judge landing page

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Footer } from '@/components/shared/footer';

export function ConditionalFooter() {
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);
  
  // Pages where footer should be hidden for full-screen experience
  const hideFooterPaths = [
    '/judge-landing',
    '/judge-dashboard',
    '/scoring',
    '/score-summary',
    '/scoreboard',
    '/rankings',
    // Add more paths here if needed in the future
  ];
  
  // Wait for pathname to be available before rendering
  useEffect(() => {
    if (pathname) {
      setIsReady(true);
    }
  }, [pathname]);
  
  // Don't render anything until pathname is ready (prevents flash)
  if (!isReady || !pathname) {
    return null;
  }
  
  // Check if current path should hide footer
  const shouldHideFooter = hideFooterPaths.some(path => 
    pathname.includes(path)
  );
  
  // Return null to hide footer on specified pages
  if (shouldHideFooter) {
    return null;
  }
  
  // Show footer on all other pages
  return <Footer />;
}