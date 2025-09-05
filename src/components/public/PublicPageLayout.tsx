import React, { useState, useEffect } from 'react';
import PublicPagesSidebar from '@/components/layout/PublicPagesSidebar';
import { useIsMobile } from '@/hooks/use-mobile';

interface PublicPageLayoutProps {
  children: React.ReactNode;
}

const PublicPageLayout = ({ children }: PublicPageLayoutProps) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleSidebarChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      setIsSidebarCollapsed(customEvent.detail.isCollapsed);
    };

    window.addEventListener('publicSidebarStateChange', handleSidebarChange);

    return () => {
      window.removeEventListener('publicSidebarStateChange', handleSidebarChange);
    };
  }, []);

  return (
    <div className="flex min-h-screen w-full">
      <PublicPagesSidebar />
      <div 
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isMobile ? 'ml-0' : (isSidebarCollapsed ? 'ml-16' : 'ml-64')
        }`}
      >
        {children}
      </div>
    </div>
  );
};

export default PublicPageLayout;