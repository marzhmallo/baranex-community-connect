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
  const getCachedData = (key: string, maxAge: number = 480000) => { // 8 minutes default (slightly less than signed URL expiry)
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

  const clearCachedData = (key: string) => {
    try {
      localStorage.removeItem(getCacheKey(key));
    } catch (error) {
      console.error('Error clearing avatar cache:', error);
    }
  };

  // Extract file path from possible full URLs
  const extractFilePath = (urlOrPath: string) => {
    if (!urlOrPath) return '';
    if (urlOrPath.includes('/storage/v1/object/public/profilepictures/')) {
      return urlOrPath.split('/storage/v1/object/public/profilepictures/')[1];
    }
    if (urlOrPath.includes('/storage/v1/object/sign/profilepictures/')) {
      return urlOrPath.split('/storage/v1/object/sign/profilepictures/')[1].split('?')[0];
    }
    // If it already looks like a path, return as-is
    return urlOrPath;
  };

  // Generate URL for display (handles full URLs and file paths)
  const generateSignedUrl = async (inputUrl: string) => {
    if (!inputUrl) return undefined;

    const filePath = extractFilePath(inputUrl);

    try {
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('profilepictures')
        .createSignedUrl(filePath, 600); // 10 minutes expiration

      if (!signedUrlError && signedUrlData?.signedUrl) {
        // Convert relative URLs to full URLs
        const signedUrl = signedUrlData.signedUrl;
        if (signedUrl.startsWith('/')) {
          return `https://dssjspakagyerrmtaakm.supabase.co/storage/v1${signedUrl}`;
        }
        return signedUrl;
      }

      // Fallback to public URL if bucket is public
      const { data: publicUrlData } = supabase.storage
        .from('profilepictures')
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        return publicUrlData.publicUrl;
      }

      if (signedUrlError) {
        console.error('Error generating signed URL:', signedUrlError);
      }
      return undefined;
    } catch (error) {
      console.error('Error generating avatar URL:', error);
      return undefined;
    }
  };

  useEffect(() => {
    console.log('CachedAvatar useEffect triggered:', { userId, profilePicture });
    if (profilePicture) {
      // Check cache first (cache lifetime < signed URL expiry)
      const cacheKey = `signed_url_${profilePicture}`;
      const cachedUrl = getCachedData(cacheKey, 480000);
      console.log('Cached URL found:', cachedUrl);
      if (cachedUrl) {
        console.log('Using cached URL:', cachedUrl);
        setAvatarUrl(cachedUrl);
        return;
      }

      console.log('Generating new signed URL for:', profilePicture);
      generateSignedUrl(profilePicture).then(url => {
        console.log('Generated signed URL:', url);
        if (url) {
          setAvatarUrl(url);
          setCachedData(cacheKey, url);
        } else {
          setAvatarUrl(undefined);
        }
      });
    } else {
      console.log('No profile picture provided');
      setAvatarUrl(undefined);
    }
  }, [profilePicture, userId]);

  console.log('CachedAvatar rendering with avatarUrl:', avatarUrl);
  
  return (
    <Avatar className={className}>
      {avatarUrl && (
        <AvatarImage 
          src={avatarUrl} 
          alt="Profile picture" 
          onLoad={() => console.log('Avatar image loaded successfully:', avatarUrl)}
          onError={(e) => {
            console.error('Failed to load avatar image:', avatarUrl, e);
            const cacheKey = `signed_url_${profilePicture || ''}`;
            clearCachedData(cacheKey);
            if (profilePicture) {
              generateSignedUrl(profilePicture).then((newUrl) => {
                console.log('Retry generated URL:', newUrl);
                if (newUrl) {
                  setAvatarUrl(newUrl);
                  setCachedData(cacheKey, newUrl);
                } else {
                  setAvatarUrl(undefined);
                }
              });
            } else {
              setAvatarUrl(undefined);
            }
          }}
        />
      )}
      <AvatarFallback className="bg-primary text-primary-foreground font-medium">
        {fallback}
      </AvatarFallback>
    </Avatar>
  );
};

export default CachedAvatar;