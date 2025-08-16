import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMemo, useState, useEffect } from 'react';
import { getSignedProfilePictureUrl } from '@/lib/avatar';

interface ForumAvatarProps {
  userId?: string;
  name?: string | null;
  profilePicture?: string | null;
  initials?: string | null;
  className?: string;
}

const ForumAvatar = ({ userId, name, profilePicture, initials, className }: ForumAvatarProps) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Generate cache key
  const getCacheKey = (userId?: string, profilePicture?: string | null) => {
    return `forum_avatar_${userId}_${profilePicture || 'none'}`;
  };

  // Get cached data
  const getCachedData = (key: string) => {
    const cached = localStorage.getItem(key);
    if (cached) {
      const data = JSON.parse(cached);
      // Check if cached data is still valid (10 minutes)
      if (Date.now() - data.timestamp < 600000) {
        return data.url;
      }
      localStorage.removeItem(key);
    }
    return null;
  };

  // Set cached data
  const setCachedData = (key: string, url: string) => {
    localStorage.setItem(key, JSON.stringify({
      url,
      timestamp: Date.now()
    }));
  };

  // Fetch and cache avatar URL
  useEffect(() => {
    if (!profilePicture || !userId) {
      setAvatarUrl(null);
      return;
    }

    const cacheKey = getCacheKey(userId, profilePicture);
    const cached = getCachedData(cacheKey);
    
    if (cached) {
      setAvatarUrl(cached);
      return;
    }

    const fetchAvatar = async () => {
      try {
        const url = await getSignedProfilePictureUrl(profilePicture);
        if (url) {
          setCachedData(cacheKey, url);
          setAvatarUrl(url);
        }
      } catch (error) {
        console.error('Error fetching avatar:', error);
      }
    };

    fetchAvatar();
  }, [userId, profilePicture]);

  // Ensure we always have fallback initials, even for minimal data
  const displayInitials = useMemo(() => {
    if (initials && initials.trim().length > 0) {
      return initials.trim().substring(0, 2).toUpperCase();
    }
    
    if (name && name.trim().length > 0) {
      return name
        .trim()
        .split(' ')
        .filter(n => n.length > 0)
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
    }
    
    // Ultimate fallback for users with no name data
    return 'U';
  }, [initials, name]);

  return (
    <Avatar className={className}>
      {avatarUrl && (
        <AvatarImage
          src={avatarUrl}
          alt={name || 'User'}
          onError={(e) => {
            // Hide failed image to show fallback
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      )}
      <AvatarFallback className="bg-primary text-primary-foreground font-medium">
        {displayInitials}
      </AvatarFallback>
    </Avatar>
  );
};

export default ForumAvatar;
