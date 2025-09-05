import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, Calendar, LayoutDashboard, FileText, BarChart3, MessageSquare, AlertTriangle, ChevronLeft, ChevronRight, Home, Award, Briefcase, BellRing, Settings, Sun, Moon, X, Menu, Shield, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import GlobalLoadingScreen from '@/components/ui/GlobalLoadingScreen';
import { useLogoutWithLoader } from '@/hooks/useLogoutWithLoader';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
const PublicSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  // Dispatch a custom event when sidebar state changes
  useEffect(() => {
    const event = new CustomEvent('publicSidebarStateChange', {
      detail: {
        isCollapsed: isMobile ? false : isCollapsed
      }
    });
    window.dispatchEvent(event);
  }, [isCollapsed, isMobile]);

  const { isLoggingOut, handleLogout } = useLogoutWithLoader();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  if (isLoggingOut) {
    return <GlobalLoadingScreen message="Logging out..." />;
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-4">
        {(!isCollapsed || isMobile) && <Link to="/hub" className="text-xl font-bold tracking-tight flex items-center">
            <span className="text-white bg-baranex-accent px-2 py-1 rounded mr-1">Bara</span>
            <span className="text-baranex-accent">NEX</span>
          </Link>}
        {!isMobile && (
          <Button variant="sidebar" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className="ml-auto">
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {[
          { to: "/hub", icon: Home, label: "Home" },
          { to: "/hub/calendar", icon: Calendar, label: "Calendar" },
          { to: "/hub/announcements", icon: BellRing, label: "Announcements" },
          { to: "/hub/officials", icon: Award, label: "Officials" },
          { to: "/hub/forum", icon: MessageSquare, label: "Forum" },
          { to: "/hub/documents", icon: FileText, label: "Documents" },
          { to: "/hub/emergency", icon: AlertTriangle, label: "Emergency" },
          { to: "/feedback", icon: MessageSquare, label: "Feedback" },
          { to: "/hub/settings", icon: Settings, label: "Settings" }
        ].map((item) => (
          <Link 
            key={item.to}
            to={item.to} 
            className={cn(
              "flex items-center py-2 px-3 rounded-md", 
              isActive(item.to) ? "bg-sidebar-accent text-white" : "text-sidebar-foreground hover:bg-sidebar-accent"
            )}
            onClick={() => isMobile && setIsMobileOpen(false)}
          >
            <item.icon className="h-5 w-5" />
            {(!isCollapsed || isMobile) && <span className="ml-2">{item.label}</span>}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <Link 
          to="/profile" 
          className={cn(
            "flex items-center py-2 px-3 rounded-md mb-2", 
            isActive("/profile") ? "bg-sidebar-accent text-white" : "text-sidebar-foreground hover:bg-sidebar-accent"
          )}
          onClick={() => isMobile && setIsMobileOpen(false)}
        >
          <User className="h-5 w-5" />
          {(!isCollapsed || isMobile) && <span className="ml-2">Profile</span>}
        </Link>
        
        <ThemeToggle isCollapsed={isCollapsed && !isMobile} />
        
        <Button variant="sidebar" className={cn("w-full justify-start mt-2", (isCollapsed && !isMobile) ? "px-2" : "")} onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
          {(!isCollapsed || isMobile) && <span className="ml-2">Sign Out</span>}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile Menu Trigger */}
        <div className="fixed top-4 left-4 z-50 md:hidden">
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="bg-background/95 backdrop-blur-sm">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-sidebar">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>
      </>
    );
  }

  return (
    <aside className={cn("fixed left-0 top-0 bottom-0 z-40 h-screen bg-sidebar transition-all duration-300 ease-in-out", isCollapsed ? "w-16" : "w-64")}>
      <SidebarContent />
    </aside>
  );
};
export default PublicSidebar;