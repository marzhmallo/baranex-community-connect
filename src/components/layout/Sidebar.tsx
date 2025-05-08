
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  User, 
  Calendar, 
  Dock,
  FileText, 
  BarChart3, 
  MessageSquare,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Home,
  Award,
  Briefcase,
  BellRing,
  Settings,
  Sun,
  Moon,
  X,
  Menu,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  // Dispatch a custom event when sidebar state changes
  useEffect(() => {
    const event = new CustomEvent('sidebarStateChange', { 
      detail: { isCollapsed } 
    });
    window.dispatchEvent(event);
  }, [isCollapsed]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out successfully",
        description: "You have been signed out",
      });
      navigate("/auth");
    }
  };
  
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 z-40 h-screen bg-sidebar transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between p-4">
          {!isCollapsed && (
            <Link to="/" className="text-xl font-bold tracking-tight flex items-center">
              <span className="text-white bg-baranex-accent px-2 py-1 rounded mr-1">Bara</span>
              <span className="text-baranex-accent">NEX</span>
            </Link>
          )}
          <Button
            variant="sidebar"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-2">
          <Link to="/" className="flex items-center py-2 px-3 text-sidebar-foreground hover:bg-sidebar-accent rounded-md">
            <Dock className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">Dashboard</span>}
          </Link>

          <Link to="/residents" className="flex items-center py-2 px-3 text-sidebar-foreground hover:bg-sidebar-accent rounded-md">
            <User className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">Residents</span>}
          </Link>

          <Link to="/households" className="flex items-center py-2 px-3 text-sidebar-foreground hover:bg-sidebar-accent rounded-md">
            <Home className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">Households</span>}
          </Link>
          
          <Link to="/officials" className="flex items-center py-2 px-3 text-sidebar-foreground hover:bg-sidebar-accent rounded-md">
            <Award className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">Officials</span>}
          </Link>

          <Link to="/documents" className="flex items-center py-2 px-3 text-sidebar-foreground hover:bg-sidebar-accent rounded-md">
            <FileText className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">Documents</span>}
          </Link>

          <Link to="/calendar" className="flex items-center py-2 px-3 text-sidebar-foreground hover:bg-sidebar-accent rounded-md">
            <Calendar className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">Calendar</span>}
          </Link>

          <Link to="/announcements" className="flex items-center py-2 px-3 text-sidebar-foreground hover:bg-sidebar-accent rounded-md">
            <BellRing className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">Announcements</span>}
          </Link>

          <Link to="/forum" className="flex items-center py-2 px-3 text-sidebar-foreground hover:bg-sidebar-accent rounded-md">
            <MessageSquare className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">Forum</span>}
          </Link>

          <Link to="/crime-reports" className="flex items-center py-2 px-3 text-sidebar-foreground hover:bg-sidebar-accent rounded-md">
            <FileText className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">Crime Reports</span>}
          </Link>

          <Link to="/statistics" className="flex items-center py-2 px-3 text-sidebar-foreground hover:bg-sidebar-accent rounded-md">
            <BarChart3 className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">Statistics</span>}
          </Link>

          <Link to="/emergencies" className="flex items-center py-2 px-3 text-sidebar-foreground hover:bg-sidebar-accent rounded-md">
            <AlertTriangle className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">Emergency Response</span>}
          </Link>
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <ThemeToggle isCollapsed={isCollapsed} />
          
          <Button 
            variant="sidebar"
            className={cn("w-full justify-start mt-2", isCollapsed ? "px-2" : "")}
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
