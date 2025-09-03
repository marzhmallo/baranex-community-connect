import React, { useState, useEffect } from 'react';
import PublicSidebar from '@/components/layout/PublicSidebar';
import { cn } from '@/lib/utils';

interface PublicPageLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const PublicPageLayout = ({ children, title }: PublicPageLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleSidebarStateChange = (event: CustomEvent) => {
      setSidebarCollapsed(event.detail.isCollapsed);
    };

    window.addEventListener('publicSidebarStateChange', handleSidebarStateChange as EventListener);
    
    return () => {
      window.removeEventListener('publicSidebarStateChange', handleSidebarStateChange as EventListener);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PublicSidebar />
      <main className={cn(
        "transition-all duration-300 ease-in-out min-h-screen",
        sidebarCollapsed ? "ml-16" : "ml-72"
      )}>
        {title && (
          <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-6 py-6">
              <h1 className="text-3xl font-bold text-foreground">{title}</h1>
            </div>
          </div>
        )}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default PublicPageLayout;