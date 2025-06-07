import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Upload, X } from 'lucide-react';

interface ProfilePictureUploadProps {
  userId: string;
  currentPhotoUrl?: string;
  onPhotoUploaded: (url: string) => void;
  userInitials?: string;
}

const ProfilePictureUpload = ({
  userId,
  currentPhotoUrl,
  onPhotoUploaded,
  userInitials = "U"
}: ProfilePictureUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(currentPhotoUrl);

  // Update photoUrl when currentPhotoUrl changes
  useEffect(() => {
    setPhotoUrl(currentPhotoUrl);
  }, [currentPhotoUrl]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      
      // Get user role to determine folder structure
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      const isAdmin = profile?.role === 'admin';
      const folder = isAdmin ? 'admin' : 'users';
      const filePath = `${folder}/${fileName}`;
      
      setUploading(true);

      const { data, error } = await supabase.storage
        .from('profilepictures')
        .upload(filePath, file, {
          upsert: true
        });

      if (error) {
        throw error;
      }

      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('profilepictures')
        .getPublicUrl(filePath);

      const url = publicUrlData.publicUrl;
      
      // Update the profiles table with the new photo URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_picture: url })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      // Update local state immediately
      setPhotoUrl(url);
      onPhotoUploaded(url);

      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been uploaded successfully"
      });
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Error uploading profile picture",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      // Reset the input
      if (event.target) event.target.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    if (!photoUrl) return;

    try {
      // Extract file path from URL
      const urlParts = photoUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      // Get user role to determine folder structure
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      const isAdmin = profile?.role === 'admin';
      const folder = isAdmin ? 'admin' : 'users';
      const filePath = `${folder}/${fileName}`;

      const { error: storageError } = await supabase.storage
        .from('profilepictures')
        .remove([filePath]);

      if (storageError) {
        console.error('Storage removal error:', storageError);
      }

      // Update the profiles table to remove the photo URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_picture: null })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      setPhotoUrl(undefined);
      onPhotoUploaded('');

      toast({
        title: "Profile picture removed",
        description: "Your profile picture has been removed"
      });
    } catch (error: any) {
      console.error('Error removing photo:', error);
      toast({
        title: "Removal failed",
        description: error.message || "Error removing profile picture",
        variant: "destructive"
      });
    }
  };

  console.log('ProfilePictureUpload render:', { photoUrl, currentPhotoUrl, userInitials });

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Avatar className="h-36 w-36">
          {photoUrl && (
            <AvatarImage 
              src={photoUrl} 
              alt="Profile picture" 
              onError={(e) => {
                console.error('Failed to load image:', photoUrl);
                setPhotoUrl(undefined);
              }}
            />
          )}
          <AvatarFallback className="text-2xl bg-muted text-muted-foreground">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        {photoUrl && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={handleRemovePhoto}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="flex items-center">
        <input
          type="file"
          id="profile-picture-upload"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
        />
        <label htmlFor="profile-picture-upload">
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            className="cursor-pointer border-border text-foreground hover:bg-muted"
            asChild
          >
            <span>
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? "Uploading..." : "Upload Photo"}
            </span>
          </Button>
        </label>
      </div>
    </div>
  );
};

export default ProfilePictureUpload;
