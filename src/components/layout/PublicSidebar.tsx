import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, Calendar, LayoutDashboard, FileText, BarChart3, MessageSquare, AlertTriangle, ChevronLeft, ChevronRight, Home, Award, Briefcase, BellRing, Settings, Sun, Moon, X, Menu, Shield, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
const PublicSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Dispatch a custom event when sidebar state changes
  useEffect(() => {
    const event = new CustomEvent('publicSidebarStateChange', {
      detail: {
        isCollapsed
      }
    });
    window.dispatchEvent(event);
  }, [isCollapsed]);
  const handleSignOut = async () => {
    const {
      error
    } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Signed out successfully",
        description: "You have been signed out"
      });
      navigate("/login");
    }
  };
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  return <aside className={cn("fixed left-0 top-0 bottom-0 z-40 h-screen bg-sidebar transition-all duration-300 ease-in-out", isCollapsed ? "w-16" : "w-64")}>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between p-4">
          {!isCollapsed && <Link to="/hub" className="text-xl font-bold tracking-tight flex items-center">
              <span className="text-white bg-baranex-accent px-2 py-1 rounded mr-1">Bara</span>
              <span className="text-baranex-accent">NEX</span>
            </Link>}
          <Button variant="sidebar" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className="ml-auto">
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-2">
          <Link to="/hub" className={cn("flex items-center py-2 px-3 rounded-md", isActive("/hub") ? "bg-sidebar-accent text-white" : "text-sidebar-foreground hover:bg-sidebar-accent")}>
            <Home className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">Home</span>}
          </Link>

          <Link to="/hub/calendar" className={cn("flex items-center py-2 px-3 rounded-md", isActive("/hub/calendar") ? "bg-sidebar-accent text-white" : "text-sidebar-foreground hover:bg-sidebar-accent")}>
            <Calendar className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">Calendar</span>}
          </Link>

          <Link to="/hub/announcements" className={cn("flex items-center py-2 px-3 rounded-md", isActive("/hub/announcements") ? "bg-sidebar-accent text-white" : "text-sidebar-foreground hover:bg-sidebar-accent")}>
            <BellRing className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">Announcements</span>}
          </Link>

          <Link to="/hub/officials" className={cn("flex items-center py-2 px-3 rounded-md", isActive("/hub/officials") ? "bg-sidebar-accent text-white" : "text-sidebar-foreground hover:bg-sidebar-accent")}>
            <Award className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">Officials</span>}
          </Link>

          <Link to="/hub/forum" className={cn("flex items-center py-2 px-3 rounded-md", isActive("/hub/forum") ? "bg-sidebar-accent text-white" : "text-sidebar-foreground hover:bg-sidebar-accent")}>
            <MessageSquare className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">Forum</span>}
          </Link>

          <Link to="/hub/documents" className={cn("flex items-center py-2 px-3 rounded-md", isActive("/hub/documents") ? "bg-sidebar-accent text-white" : "text-sidebar-foreground hover:bg-sidebar-accent")}>
            <FileText className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">Documents</span>}
          </Link>

          <Link to="/hub/emergency" className={cn("flex items-center py-2 px-3 rounded-md", isActive("/hub/emergency") ? "bg-sidebar-accent text-white" : "text-sidebar-foreground hover:bg-sidebar-accent")}>
            <AlertTriangle className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">Emergency</span>}
          </Link>

          <Link to="/feedback" className={cn("flex items-center py-2 px-3 rounded-md", isActive("/feedback") ? "bg-sidebar-accent text-white" : "text-sidebar-foreground hover:bg-sidebar-accent")}>
            <MessageSquare className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">Feedback</span>}
          </Link>

          <Link to="/hub/settings" className={cn("flex items-center py-2 px-3 rounded-md", isActive("/hub/settings") ? "bg-sidebar-accent text-white" : "text-sidebar-foreground hover:bg-sidebar-accent")}>
            <Settings className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">Settings</span>}
          </Link>
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <Link to="/profile" className={cn("flex items-center py-2 px-3 rounded-md mb-2", isActive("/profile") ? "bg-sidebar-accent text-white" : "text-sidebar-foreground hover:bg-sidebar-accent")}>
            <User className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">Profile</span>}
          </Link>
          
          <ThemeToggle isCollapsed={isCollapsed} />
          
          <Button variant="sidebar" className={cn("w-full justify-start mt-2", isCollapsed ? "px-2" : "")} onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </div>
    </aside>;
};
export default PublicSidebar;