import React, { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

interface CachedAvatarProps {
  userId: string;
  profilePicture?: string;
  fallback: string;
  className?: string;
}

const CachedAvatar = ({ userId, profilePicture, fallback, className }: CachedAvatarProps) => {
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  // Cache utilities
  const getCacheKey = (key: string) => `avatar_${userId}_${key}`;
  const getCachedData = (key: string, maxAge: number = 3300000) => { // 55 minutes default
    try {
      const cached = localStorage.getItem(getCacheKey(key));
      if (cached) {
        const data = JSON.parse(cached);
        if (Date.now() - data.timestamp < maxAge) {
          return data.value;
        }
        localStorage.removeItem(getCacheKey(key));
      }
    } catch (error) {
      console.error('Error reading avatar cache:', error);
    }
    return null;
  };

  const setCachedData = (key: string, value: any) => {
    try {
      localStorage.setItem(getCacheKey(key), JSON.stringify({
        value,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error setting avatar cache:', error);
    }
  };

  // Generate signed URL for display
  const generateSignedUrl = async (filePath: string) => {
    if (!filePath) return undefined;

    try {
      // Determine the bucket based on the file path
      let bucket = 'profilepictures';
      let actualPath = filePath;
      
      // If it's a resident photo, use the residentphotos bucket
      if (filePath.includes('resident/') || filePath.startsWith('resident/')) {
        bucket = 'residentphotos';
        actualPath = filePath.startsWith('resident/') ? filePath : `resident/${filePath}`;
      }
      
      // Extract path from full URLs if needed
      if (filePath.includes('/storage/v1/object/public/')) {
        const parts = filePath.split('/storage/v1/object/public/');
        if (parts[1]) {
          const pathParts = parts[1].split('/');
          bucket = pathParts[0];
          actualPath = pathParts.slice(1).join('/');
        }
      } else if (filePath.includes('/storage/v1/object/sign/')) {
        const parts = filePath.split('/storage/v1/object/sign/');
        if (parts[1]) {
          const pathParts = parts[1].split('/');
          bucket = pathParts[0];
          actualPath = pathParts.slice(1).join('/').split('?')[0];
        }
      }

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(actualPath, 600); // 10 minutes expiration

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

  useEffect(() => {
    if (profilePicture) {
      // Check cache first
      const cachedUrl = getCachedData('signed_url');
      if (cachedUrl) {
        setAvatarUrl(cachedUrl);
        return;
      }

      generateSignedUrl(profilePicture).then(signedUrl => {
        if (signedUrl) {
          setAvatarUrl(signedUrl);
          setCachedData('signed_url', signedUrl);
        }
      });
    } else {
      setAvatarUrl(undefined);
    }
  }, [profilePicture, userId]);

  return (
    <Avatar className={className}>
      {avatarUrl && (
        <AvatarImage 
          src={avatarUrl} 
          alt="Profile picture" 
          onError={() => {
            console.error('Failed to load avatar image:', avatarUrl);
            setAvatarUrl(undefined);
          }}
        />
      )}
      <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-600 text-white font-semibold">
        {fallback}
      </AvatarFallback>
    </Avatar>
  );
};

export default CachedAvatar;