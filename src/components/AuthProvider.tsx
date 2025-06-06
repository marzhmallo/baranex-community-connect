
import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  brgyid?: string;
  email?: string;
  role?: string;
  username?: string;
  firstname?: string;
  lastname?: string;
  middlename?: string;
  phone?: string;
  status?: string;
  adminid?: string;
  created_at?: string;
  superior_admin?: boolean;
  purok?: string;
  online?: boolean;
  last_login?: string;
  profile_picture?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  userProfile: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Update user online status and last login
  const updateUserOnlineStatus = async (userId: string, isOnline: boolean) => {
    try {
      const updateData: any = { online: isOnline };
      
      if (isOnline) {
        updateData.last_login = new Date().toISOString();
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        console.error('Error updating online status:', error);
      } else {
        console.log(`User ${userId} is now ${isOnline ? 'online' : 'offline'}`);
      }
    } catch (err) {
      console.error('Error in updateUserOnlineStatus:', err);
    }
  };

  // Fetch user profile data from profiles table
  const fetchUserProfile = async (userId: string) => {
    console.log('Fetching user profile for:', userId);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching from profiles table:', profileError);
        toast({
          title: "Database Error",
          description: "Could not fetch user profile. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (profileData) {
        console.log('User found in profiles table:', profileData);
        
        if (profileData.status === "pending") {
          await signOut();
          toast({
            title: "Account Pending Approval",
            description: "Your account is pending approval from your barangay administrator.",
            variant: "destructive",
          });
          return;
        }

        await updateUserOnlineStatus(userId, true);
        setUserProfile(profileData as UserProfile);
        
        // Handle navigation after profile is loaded
        if (location.pathname === "/login" || location.pathname === "/") {
          if (profileData.role === "user") {
            console.log('Redirecting user to /hub');
            navigate("/hub");
          } else if (profileData.role === "admin" || profileData.role === "staff") {
            console.log('Redirecting admin/staff to /dashboard');
            navigate("/dashboard");
          }
        }
        
        if (profileData.brgyid) {
          fetchBarangayData(profileData.brgyid);
        }
        return;
      }

      console.log('No user profile found in profiles table for user ID:', userId);
      toast({
        title: "Profile Not Found",
        description: "Could not find your user profile. Please contact an administrator.",
        variant: "destructive",
      });
      
      await signOut();
      
    } catch (err) {
      console.error('Error in fetchUserProfile:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching your profile.",
        variant: "destructive",
      });
    }
  };
  
  // Fetch barangay information if needed
  const fetchBarangayData = async (brgyId: string) => {
    try {
      const { data, error } = await supabase
        .from('barangays')
        .select('*')
        .eq('id', brgyId)
        .single();
      
      if (error) {
        console.error('Error fetching barangay data:', error);
        return;
      }
      
      if (data) {
        console.log('Barangay data loaded:', data);
      }
    } catch (err) {
      console.error('Error in fetchBarangayData:', err);
    }
  };

  const signOut = async () => {
    try {
      // Get current user before clearing state
      const currentUser = user;
      const currentSession = session;
      
      console.log('Signing out user:', currentUser?.id);
      
      // Update user to offline status before signing out if we have user info
      if (currentUser?.id) {
        await updateUserOnlineStatus(currentUser.id, false);
      }

      // Clear local state first
      setUser(null);
      setSession(null);
      setUserProfile(null);

      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Sign out error:", error);
        // Only show error if it's not a session missing error
        if (!error.message.includes('session')) {
          toast({
            title: "Error",
            description: "Failed to sign out completely, but you've been logged out locally.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Signed out",
          description: "You have been signed out successfully",
        });
      }
      
      // Always navigate to login regardless of sign out success
      navigate("/login");
      
    } catch (error) {
      console.error("Sign out error:", error);
      // Clear local state even if signout fails
      setUser(null);
      setSession(null);
      setUserProfile(null);
      
      toast({
        title: "Signed out locally",
        description: "You have been signed out from this device.",
      });
      
      navigate("/login");
    }
  };

  // Handle page refresh/close to set user offline
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user?.id) {
        // Use navigator.sendBeacon for reliable offline status update on page close
        const data = JSON.stringify({
          userId: user.id,
          online: false
        });
        
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/update-offline-status', data);
        }
        
        // Fallback: immediate update
        updateUserOnlineStatus(user.id, false);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user?.id]);

  useEffect(() => {
    console.log("Auth provider initialized");
    let mounted = true;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("Auth state change:", event, currentSession?.user?.id);
      
      if (!mounted) return;
      
      if (event === 'SIGNED_OUT') {
        console.log('User signed out event');
        setUser(null);
        setSession(null);
        setUserProfile(null);
        setLoading(false);
        return;
      }
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        console.log('User signed in or token refreshed');
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          // Use setTimeout to avoid blocking the auth state change
          setTimeout(() => {
            if (mounted) {
              fetchUserProfile(currentSession.user.id);
            }
          }, 100);
        }
      }
      
      setLoading(false);
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (!mounted) return;
      
      if (error) {
        console.error("Error getting session:", error);
        setLoading(false);
        return;
      }
      
      console.log("Got initial session:", initialSession?.user?.id);
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      
      if (initialSession?.user) {
        fetchUserProfile(initialSession.user.id);
      }
      
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Handle redirects based on auth status and role
  useEffect(() => {
    if (loading) return;

    // If no session and not on login page, redirect to login
    if (!session && !location.pathname.includes("/login")) {
      navigate("/login");
      return;
    }
  }, [session, loading, location.pathname, navigate]);

  return (
    <AuthContext.Provider value={{ user, session, userProfile, loading, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
