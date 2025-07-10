
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Home, FileText, BarChart3, Bell, User, Settings, Upload, Eye, X } from "lucide-react";
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
import SmartPhotoDisplay from "@/components/ui/SmartPhotoDisplay";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DashboardHeader = () => {
  const { user, userProfile, signOut } = useAuth();
  const [backgroundPhoto, setBackgroundPhoto] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  
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

  // Check if user is admin
  const isAdmin = userProfile?.role === 'admin';

  // Load existing background photo
  useEffect(() => {
    const loadBackgroundPhoto = async () => {
      if (!userProfile?.brgyid) return;
      
      try {
        const { data, error } = await supabase.storage
          .from('barangayimgs')
          .list(`backgrounds/${userProfile.brgyid}`, {
            limit: 1,
            sortBy: { column: 'created_at', order: 'desc' }
          });

        if (!error && data && data.length > 0) {
          setBackgroundPhoto(`backgrounds/${userProfile.brgyid}/${data[0].name}`);
        }
      } catch (error) {
        console.error('Error loading background photo:', error);
      }
    };

    loadBackgroundPhoto();
  }, [userProfile?.brgyid]);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userProfile?.brgyid) return;

    setUploading(true);
    try {
      // Upload new background photo
      const fileName = `background-${Date.now()}.${file.name.split('.').pop()}`;
      const filePath = `backgrounds/${userProfile.brgyid}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('barangayimgs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Remove old background photos for this barangay
      try {
        const { data: existingFiles } = await supabase.storage
          .from('barangayimgs')
          .list(`backgrounds/${userProfile.brgyid}`);

        if (existingFiles && existingFiles.length > 1) {
          const filesToDelete = existingFiles
            .filter(f => f.name !== fileName)
            .map(f => `backgrounds/${userProfile.brgyid}/${f.name}`);

          await supabase.storage
            .from('barangayimgs')
            .remove(filesToDelete);
        }
      } catch (cleanupError) {
        console.warn('Error cleaning up old background photos:', cleanupError);
      }

      setBackgroundPhoto(filePath);
      setUploadDialogOpen(false);
      toast({
        title: "Success",
        description: "Background photo updated successfully",
      });
    } catch (error) {
      console.error('Error uploading background photo:', error);
      toast({
        title: "Error",
        description: "Failed to upload background photo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeBackgroundPhoto = async () => {
    if (!backgroundPhoto || !userProfile?.brgyid) return;

    try {
      const { error } = await supabase.storage
        .from('barangayimgs')
        .remove([backgroundPhoto]);

      if (error) throw error;

      setBackgroundPhoto(null);
      toast({
        title: "Success",
        description: "Background photo removed successfully",
      });
    } catch (error) {
      console.error('Error removing background photo:', error);
      toast({
        title: "Error",
        description: "Failed to remove background photo",
        variant: "destructive",
      });
    }
  };

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
      
      <Card className="border-none overflow-hidden relative">
        {/* Background Photo */}
        {backgroundPhoto && (
          <div className="absolute inset-0">
            <SmartPhotoDisplay
              bucketName="barangayimgs"
              filePath={backgroundPhoto}
              isPublic={true}
              className="w-full h-full object-cover"
              alt="Dashboard Background"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-baranex-primary/90 to-baranex-secondary/90" />
          </div>
        )}
        
        {/* Fallback gradient when no background photo */}
        {!backgroundPhoto && (
          <div className="absolute inset-0 bg-gradient-to-r from-baranex-primary to-baranex-secondary" />
        )}

        <CardContent className="relative p-6 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">Welcome to Baranex</h2>
                {isAdmin && (
                  <div className="flex gap-1">
                    <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-white hover:bg-white/20"
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Upload Background Photo</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="background-photo">Choose Photo</Label>
                            <Input
                              id="background-photo"
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoUpload}
                              disabled={uploading}
                            />
                          </div>
                          {uploading && (
                            <p className="text-sm text-muted-foreground">Uploading...</p>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    {backgroundPhoto && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-white hover:bg-white/20"
                        onClick={removeBackgroundPhoto}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardHeader;
