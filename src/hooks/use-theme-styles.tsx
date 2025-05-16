
import { useTheme } from "@/components/theme/ThemeProvider";

type StyleOptions = {
  light: string;
  dark: string;
  base?: string;
};

/**
 * A hook that returns CSS class names based on the current theme
 * 
 * @param options - Object containing light and dark theme classes and optional base classes
 * @returns String of CSS classes appropriate for the current theme
 */
export function useThemeStyles(options: StyleOptions): string {
  const { theme } = useTheme();
  
  const baseClasses = options.base || "";
  const themeClasses = theme === "dark" ? options.dark : options.light;
  
  return `${baseClasses} ${themeClasses}`.trim();
}

/**
 * A utility function to conditionally apply dark mode styles
 * 
 * @param lightClasses - Classes to apply in light mode
 * @param darkClasses - Classes to apply in dark mode
 * @returns Function that takes the current theme and returns appropriate classes
 */
export function themeClasses(lightClasses: string, darkClasses: string) {
  return (theme: "light" | "dark") => theme === "dark" ? darkClasses : lightClasses;
}
