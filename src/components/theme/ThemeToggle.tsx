
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useEffect } from "react";

interface ThemeToggleProps {
  isCollapsed?: boolean;
}

export function ThemeToggle({ isCollapsed }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  // Apply theme to document root when it changes
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove both theme classes first
    root.classList.remove("light", "dark");
    
    // Apply the current theme
    root.classList.add(theme || "light");
    
    // Set the color-scheme CSS property for system-level integration
    document.documentElement.style.setProperty('color-scheme', theme);
    
    // Trigger a custom event to let the app know theme has changed
    // This can be useful for components that need to respond to theme changes
    window.dispatchEvent(new CustomEvent('themeChange', { 
      detail: { theme } 
    }));
  }, [theme]);

  const icon = theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />;
  const label = theme === "light" ? "Dark Mode" : "Light Mode";

  return (
    <Button
      variant="sidebar"
      className={`w-full justify-start ${isCollapsed ? "px-2" : "px-4"} transition-all duration-300 border border-sidebar-border`}
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      {icon}
      {!isCollapsed && <span className="ml-2">{label}</span>}
    </Button>
  );
}
