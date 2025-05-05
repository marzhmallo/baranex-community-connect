
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  MessageSquare, 
  FileText, 
  BarChart3, 
  AlertTriangle,
  Settings,
  HelpCircle,
  LogOut
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Residents', href: '/residents', icon: Users },
  { name: 'Announcements', href: '/announcements', icon: Calendar },
  { name: 'Forum', href: '/forum', icon: MessageSquare },
  { name: 'Crime Reports', href: '/crime-reports', icon: FileText },
  { name: 'Statistics', href: '/statistics', icon: BarChart3 },
  { name: 'Emergency Response', href: '/emergencies', icon: AlertTriangle },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Redirect to auth page on successful sign out
      navigate('/auth');
    }
  };
  
  return (
    <aside className="hidden md:flex md:w-64 fixed inset-y-0 z-40 flex-col bg-sidebar border-r border-sidebar-border">
      <div className="flex flex-col h-full w-64 min-w-64 max-w-64"> {/* Fixed width */}
        <div className="h-16 flex items-center border-b border-sidebar-border px-6">
          <Link to="/" className="text-xl font-bold tracking-tight flex items-center">
            <span className="text-white bg-baranex-accent px-2 py-1 rounded mr-1">Baran</span>
            <span className="text-baranex-accent">EX</span>
          </Link>
        </div>
        
        <div className="flex-1 overflow-auto py-4 px-3">
          <nav className="space-y-1 w-full">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full",
                    isActive
                      ? "bg-sidebar-accent text-white"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white"
                  )}
                >
                  <item.icon className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0",
                    isActive
                      ? "text-sidebar-primary"
                      : "text-sidebar-foreground/60 group-hover:text-white"
                  )} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex flex-col space-y-2">
            <button className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white w-full">
              <Settings className="mr-3 h-5 w-5 text-sidebar-foreground/60" />
              Settings
            </button>
            <button className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white w-full">
              <HelpCircle className="mr-3 h-5 w-5 text-sidebar-foreground/60" />
              Help
            </button>
            <button 
              onClick={handleSignOut}
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-sidebar-foreground hover:bg-red-700/50 hover:text-white w-full"
            >
              <LogOut className="mr-3 h-5 w-5 text-sidebar-foreground/60" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
