import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';

export function useLogoutWithLoader() {
  const { signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await signOut(); // AuthProvider handles navigation and cleanup
    } finally {
      // In most cases the component unmounts after navigation
      setIsLoggingOut(false);
    }
  };

  return { isLoggingOut, handleLogout };
}
