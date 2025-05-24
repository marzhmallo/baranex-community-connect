
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Upload, X } from 'lucide-react';

interface OfficialPhotoUploadProps {
  officialId?: string;
  existingPhotoUrl?: string;
  onPhotoUploaded: (url: string) => void;
}

const OfficialPhotoUpload = ({
  officialId,
  existingPhotoUrl,
  onPhotoUploaded
}: OfficialPhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(existingPhotoUrl);
  const { toast } = useToast();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${officialId || 'new'}-${Date.now()}.${fileExt}`;
      const filePath = `official/${fileName}`;
      
      setUploading(true);

      const { data, error } = await supabase.storage
        .from('officials')
        .upload(filePath, file, {
          upsert: true
        });

      if (error) {
        throw error;
      }

      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('officials')
        .getPublicUrl(filePath);

      const url = publicUrlData.publicUrl;
      setPhotoUrl(url);
      onPhotoUploaded(url);

      toast({
        title: "Photo uploaded",
        description: "Official photo has been uploaded successfully"
      });
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Error uploading photo",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      // Reset the input
      if (event.target) event.target.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    if (!photoUrl || !existingPhotoUrl) return;

    try {
      // Extract file path from URL
      const urlParts = photoUrl.split('/');
      const filePath = `official/${urlParts[urlParts.length - 1]}`;

      const { error } = await supabase.storage
        .from('officials')
        .remove([filePath]);

      if (error) {
        throw error;
      }

      setPhotoUrl(undefined);
      onPhotoUploaded('');

      toast({
        title: "Photo removed",
        description: "Official photo has been removed"
      });
    } catch (error: any) {
      console.error('Error removing photo:', error);
      toast({
        title: "Removal failed",
        description: error.message || "Error removing photo",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex flex-col items-center mb-4">
      <div className="mb-4">
        {photoUrl ? (
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={photoUrl} alt="Official photo" />
              <AvatarFallback>
                {officialId ? officialId.substring(0, 2).toUpperCase() : "OF"}
              </AvatarFallback>
            </Avatar>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={handleRemovePhoto}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Avatar className="h-24 w-24">
            <AvatarFallback>
              {officialId ? officialId.substring(0, 2).toUpperCase() : "OF"}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
      
      <div className="flex items-center">
        <input
          type="file"
          id="official-photo-upload"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
        />
        <label htmlFor="official-photo-upload">
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            className="cursor-pointer"
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

export default OfficialPhotoUpload;
