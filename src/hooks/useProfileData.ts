
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProfileData {
  id: string;
  firstname?: string;
  lastname?: string;
  email: string;
}

export const useProfileData = (profileId: string | null) => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!profileId) {
        setProfileData(null);
        return;
      }

      setIsLoading(true);
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, firstname, lastname, email')
          .eq('id', profileId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
          setProfileData(null);
        } else if (profile) {
          setProfileData(profile);
        } else {
          setProfileData(null);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setProfileData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [profileId]);

  const getDisplayName = () => {
    if (!profileData) return 'Unknown User';
    
    const firstName = profileData.firstname || '';
    const lastName = profileData.lastname || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    } else {
      return profileData.email || 'Unknown User';
    }
  };

  return {
    profileData,
    isLoading,
    displayName: getDisplayName()
  };
};
