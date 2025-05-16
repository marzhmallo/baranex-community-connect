
import * as React from "react"

// Define common breakpoints for reference
export const BREAKPOINTS = {
  xs: 320,     // Extra small screens, phones
  sm: 640,     // Small screens, large phones
  md: 768,     // Medium screens, tablets
  lg: 1024,    // Large screens, laptops
  xl: 1280,    // Extra large screens, desktops
  '2xl': 1536, // 2X large screens
  '3xl': 1920  // 3X large screens (our target design size)
}

type ResolutionInfo = {
  width: number;
  height: number;
  isXs: boolean;
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  is2xl: boolean;
  is3xl: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
  scaleFactor: number; // A value to use for scaling elements if needed
}

export function useResolution(): ResolutionInfo {
  const [resolution, setResolution] = React.useState<ResolutionInfo>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
    isXs: false,
    isSm: false,
    isMd: false,
    isLg: false,
    isXl: false,
    is2xl: false,
    is3xl: false,
    isPortrait: false,
    isLandscape: true,
    scaleFactor: 1
  });

  React.useEffect(() => {
    const updateResolution = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isPortrait = height > width;
      
      // Calculate scale factor relative to 1920x1080
      // This gives us a proportional value we can use to scale elements
      // 1.0 means we're at the target 1920x1080 resolution
      const scaleFactor = Math.min(width / 1920, height / 1080);
      
      setResolution({
        width,
        height,
        isXs: width < BREAKPOINTS.sm,
        isSm: width >= BREAKPOINTS.sm && width < BREAKPOINTS.md,
        isMd: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
        isLg: width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl,
        isXl: width >= BREAKPOINTS.xl && width < BREAKPOINTS['2xl'],
        is2xl: width >= BREAKPOINTS['2xl'] && width < BREAKPOINTS['3xl'],
        is3xl: width >= BREAKPOINTS['3xl'],
        isPortrait,
        isLandscape: !isPortrait,
        scaleFactor
      });
    };

    // Set initial values
    updateResolution();
    
    // Add event listener
    window.addEventListener('resize', updateResolution);
    
    // Clean up
    return () => window.removeEventListener('resize', updateResolution);
  }, []);

  return resolution;
}

// Helper component to apply responsive scaling
export const ResponsiveContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  maintainAspectRatio?: boolean;
}> = ({ children, className = "", maintainAspectRatio = false }) => {
  const { width, scaleFactor } = useResolution();
  
  // Only apply scaling if screen is smaller than 1920
  const shouldScale = width < 1920 && maintainAspectRatio;
  
  return (
    <div 
      className={`${className} ${shouldScale ? 'scale-content' : ''}`}
      style={shouldScale ? { 
        transform: `scale(${scaleFactor})`,
        transformOrigin: 'top left',
        width: maintainAspectRatio ? `${100/scaleFactor}%` : '100%',
        height: maintainAspectRatio ? `${100/scaleFactor}%` : '100%',
      } : {}}
    >
      {children}
    </div>
  );
};
