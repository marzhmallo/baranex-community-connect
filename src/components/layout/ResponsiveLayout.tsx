
import React from 'react';
import { useResolution } from '@/hooks/use-resolution';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: string | number;
  padding?: string;
  centerContent?: boolean;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  className = "",
  maxWidth = "1920px",
  padding = "px-2 sm:px-4 md:px-6 lg:px-8",
  centerContent = true
}) => {
  const { width } = useResolution();
  
  // Calculate the top padding based on the screen width
  // to maintain aspect ratio with 1920x1080
  const getTopPadding = () => {
    if (width >= 1920) return ""; // No padding needed for full size
    if (width >= 1366) return "pt-0"; // Minimal padding for large screens
    if (width >= 1024) return "pt-2"; // Small padding for medium screens
    return "pt-3"; // More padding for small screens
  };

  return (
    <div
      className={`w-full ${padding} ${getTopPadding()} ${centerContent ? 'mx-auto' : ''} ${className}`}
      style={{
        maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
      }}
    >
      {children}
    </div>
  );
};

export default ResponsiveLayout;
