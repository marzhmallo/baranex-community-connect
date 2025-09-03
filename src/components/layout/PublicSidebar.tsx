import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  Calendar, 
  Users, 
  AlertTriangle, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/IconThemeToggle';

const PublicSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get current barangay from URL params
  const searchParams = new URLSearchParams(location.search);
  const barangayId = searchParams.get('barangay');

  // Dispatch a custom event when sidebar state changes
  useEffect(() => {
    const event = new CustomEvent('publicSidebarStateChange', {
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
      path: `/public/announcements${barangayId ? `?barangay=${barangayId}` : ''}`,
      icon: FileText,
      label: 'Announcements',
      description: 'Latest news & updates'
    },
    {
      path: `/public/events${barangayId ? `?barangay=${barangayId}` : ''}`,
      icon: Calendar,
      label: 'Events Calendar',
      description: 'Community events'
    },
    {
      path: `/public/officials${barangayId ? `?barangay=${barangayId}` : ''}`,
      icon: Users,
      label: 'Officials',
      description: 'Meet your leaders'
    },
    {
      path: `/public/emergency${barangayId ? `?barangay=${barangayId}` : ''}`,
      icon: AlertTriangle,
      label: 'Emergency',
      description: 'Safety & response'
    },
    {
      path: `/public/forum${barangayId ? `?barangay=${barangayId}` : ''}`,
      icon: MessageSquare,
      label: 'Community Forum',
      description: 'Join discussions'
    }
  ];

  return (
    <aside className={cn(
      "fixed left-0 top-0 bottom-0 z-40 h-screen bg-gradient-to-b from-primary/5 to-background border-r border-border transition-all duration-300 ease-in-out backdrop-blur-sm",
      isCollapsed ? "w-16" : "w-72"
    )}>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <MapPin className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-foreground">Barangay</span>
                <span className="text-xs text-muted-foreground">Public Portal</span>
              </div>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 p-0 hover:bg-primary/10"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 p-4 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path.split('?')[0]);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                  active 
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {/* Active indicator */}
                {active && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                )}
                
                <Icon className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  active ? "text-primary" : "group-hover:text-foreground"
                )} />
                
                {!isCollapsed && (
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className={cn(
                      "text-sm font-medium truncate",
                      active ? "text-primary" : "group-hover:text-foreground"
                    )}>
                      {item.label}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {item.description}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border/50 space-y-3">
          <ThemeToggle />
          
          <Button 
            variant="outline" 
            className={cn(
              "w-full justify-start gap-2 hover:bg-primary/5 hover:border-primary/20",
              isCollapsed ? "px-2" : "px-3"
            )}
            onClick={() => navigate('/')}
          >
            <Home className="h-4 w-4" />
            {!isCollapsed && <span className="text-sm">Back to Home</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default PublicSidebar;