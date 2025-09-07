import React from 'react';

interface UserLayoutProps {
  children: React.ReactNode;
}

const UserLayout = ({ children }: UserLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Main content container with top padding to account for fixed header */}
      <main className="pt-28 md:pt-16 min-h-screen">
        {children}
      </main>
    </div>
  );
};

export default UserLayout;