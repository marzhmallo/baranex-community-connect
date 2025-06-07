
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

      console.log(`Updating user ${userId} online status to: ${isOnline}`);
      
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

        // Set user to ONLINE when successfully fetching profile (login)
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
      // Store current user ID before clearing state
      const currentUserId = user?.id;
      
      console.log('Signing out user:', currentUserId);
      
      // Update user to OFFLINE status BEFORE clearing state and signing out
      if (currentUserId) {
        await updateUserOnlineStatus(currentUserId, false);
      }

      // Clear local state
      setUser(null);
      setSession(null);
      setUserProfile(null);

      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error && !error.message.includes('session')) {
        console.error("Sign out error:", error);
        toast({
          title: "Error",
          description: "Failed to sign out completely, but you've been logged out locally.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Signed out",
          description: "You have been signed out successfully",
        });
      }
      
      // Always navigate to login
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
    const handleBeforeUnload = async () => {
      if (user?.id) {
        // Use synchronous approach for page close
        try {
          await updateUserOnlineStatus(user.id, false);
        } catch (error) {
          console.error('Error updating offline status on page close:', error);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && user?.id) {
        // Page is being hidden, update to offline
        updateUserOnlineStatus(user.id, false);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id]);

  useEffect(() => {
    console.log("Auth provider initialized");
    let mounted = true;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("Auth state change:", event, currentSession?.user?.id);
      
      if (!mounted) return;
      
      if (event === 'SIGNED_OUT') {
        console.log('User signed out event - clearing state');
        // Get user ID before clearing state for offline update
        const userId = user?.id;
        
        setUser(null);
        setSession(null);
        setUserProfile(null);
        setLoading(false);
        
        // Update offline status after automatic logout
        if (userId) {
          await updateUserOnlineStatus(userId, false);
        }
        return;
      }
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        console.log('User signed in or token refreshed');
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user && mounted) {
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
