
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
    root.classList.remove("light", "dark");
    root.classList.add(theme || "light");
  }, [theme]);

  const icon = theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />;
  const label = theme === "light" ? "Dark Mode" : "Light Mode";

  return (
    <Button
      variant="sidebar"
      className={`w-full justify-start ${isCollapsed ? "px-2" : "px-4"} transition-all duration-300`}
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      {icon}
      {!isCollapsed && <span className="ml-2">{label}</span>}
    </Button>
  );
}
