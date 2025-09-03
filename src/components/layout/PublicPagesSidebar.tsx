import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  FileText, 
  MessageSquare, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  Award, 
  BellRing, 
  ArrowLeft,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/IconThemeToggle';

const PublicPagesSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  // Dispatch a custom event when sidebar state changes
  useEffect(() => {
    const event = new CustomEvent('publicPagesSidebarStateChange', {
      detail: {
        isCollapsed
      }
    });
    window.dispatchEvent(event);
  }, [isCollapsed]);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navigationItems = [
    {
      path: '/public/announcements',
      icon: BellRing,
      label: 'Announcements'
    },
    {
      path: '/public/events',
      icon: Calendar,
      label: 'Events'
    },
    {
      path: '/public/officials',
      icon: Award,
      label: 'Officials'
    },
    {
      path: '/public/emergency',
      icon: AlertTriangle,
      label: 'Emergency'
    },
    {
      path: '/public/forum',
      icon: MessageSquare,
      label: 'Forum'
    }
  ];

  return (
    <aside className={cn(
      "fixed left-0 top-0 bottom-0 z-40 h-screen bg-gradient-to-b from-primary via-primary/95 to-primary/90 transition-all duration-300 ease-in-out shadow-2xl",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-primary-foreground/20">
          {!isCollapsed && (
            <Link to="/" className="text-xl font-bold tracking-tight flex items-center text-primary-foreground">
              <MapPin className="h-6 w-6 mr-2" />
              <span>Barangay Portal</span>
            </Link>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className="ml-auto text-primary-foreground hover:bg-primary-foreground/20"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 p-4 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center py-3 px-3 rounded-lg transition-all duration-200 group",
                  isActive(item.path)
                    ? "bg-primary-foreground/20 text-primary-foreground shadow-md"
                    : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="ml-3 font-medium group-hover:translate-x-1 transition-transform duration-200">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-primary-foreground/20 space-y-2">
          <ThemeToggle />
          
          <Link to="/">
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start text-primary-foreground hover:bg-primary-foreground/20 transition-all duration-200",
                isCollapsed ? "px-2" : "px-3"
              )}
            >
              <ArrowLeft className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="ml-3">Back to Home</span>}
            </Button>
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default PublicPagesSidebar;