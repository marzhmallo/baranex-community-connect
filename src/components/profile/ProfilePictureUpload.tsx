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
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);

  // Generate signed URL for display
  const generateSignedUrl = async (url: string) => {
    if (!url) return undefined;

    try {
      // Extract file path from URL (works for both public and signed URLs)
      let filePath = '';
      
      // Check if it's a public URL format
      if (url.includes('/storage/v1/object/public/profilepictures/')) {
        filePath = url.split('/storage/v1/object/public/profilepictures/')[1];
      } else if (url.includes('/storage/v1/object/sign/profilepictures/')) {
        filePath = url.split('/storage/v1/object/sign/profilepictures/')[1].split('?')[0];
      } else {
        // If it's already a file path, use it directly
        const isAdmin = await checkIfAdmin();
        const folder = isAdmin ? 'admin' : 'users';
        filePath = url.startsWith(`${folder}/`) ? url : `${folder}/${url}`;
      }

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('profilepictures')
        .createSignedUrl(filePath, 600); // 10 minutes expiration

      if (signedUrlError) {
        console.error('Error generating signed URL:', signedUrlError);
        return undefined;
      }

      return signedUrlData.signedUrl;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      return undefined;
    }
  };

  // Helper function to check if user is admin
  const checkIfAdmin = async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    return profile?.role === 'admin';
  };

  // Generate signed URL when currentPhotoUrl changes
  useEffect(() => {
    if (currentPhotoUrl) {
      generateSignedUrl(currentPhotoUrl).then(signedUrl => {
        setPhotoUrl(signedUrl);
      });
    } else {
      setPhotoUrl(undefined);
    }
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

      // Get a signed URL (expires in 10 minutes)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('profilepictures')
        .createSignedUrl(filePath, 600);

      if (signedUrlError) {
        throw signedUrlError;
      }

      const url = signedUrlData.signedUrl;
      
      // Update the profiles table with the file path (not the signed URL)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_picture: filePath })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      // Update local state with signed URL for immediate display
      setPhotoUrl(url);
      onPhotoUploaded(filePath); // Pass file path to parent component

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
