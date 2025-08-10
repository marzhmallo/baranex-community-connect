import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAvatarUrl } from '@/hooks/useAvatarUrl';

interface ForumAvatarProps {
  userId?: string;
  name?: string | null;
  profilePicture?: string | null;
  initials?: string | null;
  className?: string;
}

const ForumAvatar = ({ userId, name, profilePicture, initials, className }: ForumAvatarProps) => {
  const { data: url } = useAvatarUrl({
    userId,
    profilePicture,
    initialUrl: profilePicture,
  });

  const displayInitials = (initials && initials.trim().length > 0)
    ? initials
    : (name || 'UN')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

  return (
    <Avatar className={className}>
      {url && (
        <AvatarImage
          src={url}
          alt={name || 'User'}
          onError={(e) => {
            // If image fails, let the hook refetch next time
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
