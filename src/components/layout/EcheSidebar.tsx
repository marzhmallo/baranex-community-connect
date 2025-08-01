import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Gauge, 
  Building2, 
  Building,
  Users, 
  Settings, 
  User, 
  LogOut,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";

interface SidebarItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  route?: string;
}

interface EcheSidebarProps {
  activeRoute?: string;
}

export const EcheSidebar = ({ 
  activeRoute = 'dashboard'
}: EcheSidebarProps) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
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

  const sidebarNavItems: SidebarItem[] = [
    { 
      icon: Gauge, 
      label: 'Dashboard', 
      active: activeRoute === 'dashboard', 
      route: '/echelon'
    },
    { 
      icon: Building2, 
      label: 'Municipalities', 
      active: activeRoute === 'municipalities', 
      route: '/municipalities'
    },
    { 
      icon: Building, 
      label: 'Barangays', 
      active: activeRoute === 'barangays', 
      route: '/barangays'
    },
    { 
      icon: Users, 
      label: 'User Management', 
      active: activeRoute === 'users', 
      route: '/users'
    },
    { 
      icon: Settings, 
      label: 'System Settings', 
      active: activeRoute === 'settings', 
      route: '/system-settings'
    },
  ];

  return (
    <div className="w-64 bg-slate-800 text-white fixed h-full">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="text-white h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Baranex</h1>
              <p className="text-sm text-slate-400">System</p>
            </div>
          </div>
          <NotificationDropdown />
        </div>
      </div>
      
      <nav className="mt-6 px-4">
        <ul className="space-y-2">
          {sidebarNavItems.map((item, index) => (
            <li key={index}>
              <button 
                onClick={() => {
                  if (item.route) {
                    navigate(item.route);
                  }
                }}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left transition-colors ${
                  item.active 
                    ? 'bg-primary text-white' 
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
              <User className="text-sm" />
            </div>
            <span className="text-sm">Super Admin</span>
          </div>
          <Button
            onClick={handleSignOut}
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};