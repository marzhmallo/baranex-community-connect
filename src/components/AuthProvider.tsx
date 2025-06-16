
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
  const [hasHandledInitialAuth, setHasHandledInitialAuth] = useState(false);
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

  // Fetch user profile data from profiles table - NO REDIRECTS HERE
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

  // Handle redirect logic ONLY for initial authentication
  const handleInitialRedirect = async (profileData: UserProfile) => {
    const isLoginOrRoot = location.pathname === "/login" || location.pathname === "/";
    
    if (!isLoginOrRoot) {
      console.log('Not on login/root page, skipping redirect. Current path:', location.pathname);
      return;
    }

    console.log('Initial authentication redirect for role:', profileData.role);
    
    if (profileData.role === "user") {
      console.log('Redirecting user to /hub');
      navigate("/hub");
    } else if (profileData.role === "admin" || profileData.role === "staff") {
      console.log('Redirecting admin/staff to /dashboard');
      navigate("/dashboard");
    }
  };

  const signOut = async () => {
    try {
      console.log('Starting sign out process...');
      
      // Store current user ID before clearing state
      const currentUserId = user?.id;
      
      // Clear local state FIRST to prevent any UI issues
      setUser(null);
      setSession(null);
      setUserProfile(null);
      
      // Update user to OFFLINE status if we have a user ID
      if (currentUserId) {
        console.log('Setting user offline before logout:', currentUserId);
        await updateUserOnlineStatus(currentUserId, false);
      }

      // Force sign out from Supabase and clear all local storage
      console.log('Clearing Supabase session...');
      await supabase.auth.signOut({ scope: 'global' });
      
      // Additional cleanup - clear any remaining auth data
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
      
      console.log('Sign out completed successfully');
      
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
      
      // Navigate to login
      navigate("/login");
      
    } catch (error: any) {
      console.error("Sign out error:", error);
      
      // Even if signout fails, clear local state and redirect
      setUser(null);
      setSession(null);
      setUserProfile(null);
      
      // Force clear storage
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
      
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

    // Only listen for actual page unload, not tab switches
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user?.id]);

  useEffect(() => {
    console.log("Auth provider initialized");
    let mounted = true;
    
    // Clear any existing session data on mount to prevent conflicts
    const clearConflictingSessions = async () => {
      try {
        // Get current session to check if it's valid
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.log('Session error detected, clearing:', error.message);
          localStorage.removeItem('supabase.auth.token');
          sessionStorage.clear();
        } else if (currentSession) {
          console.log('Valid session found:', currentSession.user?.id);
        }
      } catch (err) {
        console.error('Error checking session:', err);
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.clear();
      }
    };
    
    clearConflictingSessions();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("Auth state change:", event, currentSession?.user?.id, "Path:", location.pathname);
      
      if (!mounted) return;
      
      if (event === 'SIGNED_OUT') {
        console.log('User signed out event - clearing state');
        setUser(null);
        setSession(null);
        setUserProfile(null);
        setHasHandledInitialAuth(false);
        setLoading(false);
        return;
      }
      
      // Update session and user for all events
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      // Only handle profile fetching and redirects for SIGNED_IN and initial load
      if (event === 'SIGNED_IN' && !hasHandledInitialAuth) {
        console.log('Processing SIGNED_IN event for first time');
        
        if (currentSession?.user && mounted) {
          setHasHandledInitialAuth(true);
          
          setTimeout(async () => {
            if (mounted) {
              await fetchUserProfile(currentSession.user.id);
              
              // Get fresh profile data for redirect
              const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentSession.user.id)
                .maybeSingle();
              
              if (profileData) {
                await handleInitialRedirect(profileData as UserProfile);
              }
            }
          }, 100);
        }
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed - updating profile silently, NO REDIRECTS');
        
        // Only update profile data, never redirect on token refresh
        if (currentSession?.user && mounted) {
          setTimeout(() => {
            if (mounted) {
              fetchUserProfile(currentSession.user.id);
            }
          }, 100);
        }
      }
      
      setLoading(false);
    });

    // Get initial session with better error handling
    supabase.auth.getSession().then(async ({ data: { session: initialSession }, error }) => {
      if (!mounted) return;
      
      if (error) {
        console.error("Error getting session:", error);
        // Clear potentially corrupted session data
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.clear();
        setLoading(false);
        return;
      }
      
      console.log("Got initial session:", initialSession?.user?.id);
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      
      if (initialSession?.user && !hasHandledInitialAuth) {
        setHasHandledInitialAuth(true);
        await fetchUserProfile(initialSession.user.id);
        
        // ONLY redirect on initial load from login/root page - not when already authenticated on other pages
        const isLoginOrRoot = location.pathname === "/login" || location.pathname === "/";
        if (isLoginOrRoot) {
          console.log('Initial load from login/root, checking for redirect...');
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', initialSession.user.id)
            .maybeSingle();
          
          if (profileData) {
            await handleInitialRedirect(profileData as UserProfile);
          }
        } else {
          console.log('Already on valid page, no redirect needed. Current path:', location.pathname);
        }
      }
      
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Remove location dependency and keep empty to prevent re-running

  return (
    <AuthContext.Provider value={{ user, session, userProfile, loading, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
