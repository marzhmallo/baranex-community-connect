
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Home, FileText, BarChart3, Bell, User, Settings } from "lucide-react";
import { Link } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";

const DashboardHeader = () => {
  const { user, userProfile, signOut } = useAuth();
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const greeting = () => {
    const hour = today.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Get display name for the header greeting
  const displayName = userProfile?.firstname || user?.email?.split('@')[0] || 'User';

  // Get username for the dropdown button
  const username = userProfile?.username || userProfile?.firstname || user?.email?.split('@')[0] || 'User';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">{greeting()}, {displayName} • {formattedDate}</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <NotificationDropdown />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <User className="h-4 w-4" />
                <span className="md:inline">{username}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex items-center w-full">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex items-center w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={signOut} className="text-red-500 cursor-pointer">
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <Card className="bg-gradient-to-r from-baranex-primary to-baranex-secondary border-none overflow-hidden">
        <CardContent className="p-6 text-white">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Welcome to Baranex</h2>
              <p className="text-white/80 max-w-md">
                Your partner in digital barangay management. Access and manage resident data, documents, and community events all in one place.
              </p>
              <div className="pt-2 flex gap-2">
                <Button variant="secondary" size="sm" className="bg-white text-baranex-primary hover:bg-white/90" asChild>
                  <Link to="/guide">
                    <span>View Guide</span>
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="bg-transparent border-white text-white hover:bg-white/20" asChild>
                  <Link to="/announcements/new">
                    <span>Post Announcement</span>
                  </Link>
                </Button>
              </div>
            </div>
            <div className="hidden md:block">
              <img 
                src="/lovable-uploads/9f4d6606-b6fe-4613-8188-8b1b5b4cdbd4.png" 
                alt="Dashboard Illustration" 
                className="w-32 h-32 object-contain opacity-75" 
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardHeader;
