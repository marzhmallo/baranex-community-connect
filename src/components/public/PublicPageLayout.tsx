import React, { useState, useEffect } from 'react';
import PublicPagesSidebar from '@/components/layout/PublicPagesSidebar';

interface PublicPageLayoutProps {
  children: React.ReactNode;
}

const PublicPageLayout = ({ children }: PublicPageLayoutProps) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleSidebarChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      setIsSidebarCollapsed(customEvent.detail.isCollapsed);
    };

    window.addEventListener('publicPagesSidebarStateChange', handleSidebarChange);

    return () => {
      window.removeEventListener('publicPagesSidebarStateChange', handleSidebarChange);
    };
  }, []);

  return (
    <div className="flex min-h-screen w-full">
      <PublicPagesSidebar />
      <div 
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        {children}
      </div>
    </div>
  );
};

export default PublicPageLayout;