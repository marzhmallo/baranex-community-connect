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
  const [authInitialized, setAuthInitialized] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Clear profile fetched flag when user changes
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Update user online status and last login
  const updateUserOnlineStatus = async (userId: string, isOnline: boolean) => {
    try {
      const updateData: any = { online: isOnline };
      
      // If user is logging in (going online), update last_login with full timestamp
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

  // Fetch user profile data from profiles table only
  const fetchUserProfile = async (userId: string) => {
    // Skip if we're trying to fetch the same user repeatedly
    if (currentUserId === userId && userProfile !== null) return;
    
    console.log('Fetching user profile for:', userId);
    try {
      // Fetch from profiles table for all user types
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

      // If found in profiles table
      if (profileData) {
        console.log('User found in profiles table:', profileData);
        
        // Check if user status is pending
        if (profileData.status === "pending") {
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          setUserProfile(null);
          setCurrentUserId(null);
          toast({
            title: "Account Pending Approval",
            description: "Your account is pending approval from your barangay administrator.",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }

        // Update user to online status and last login
        await updateUserOnlineStatus(userId, true);

        setUserProfile(profileData as UserProfile);
        setCurrentUserId(userId);
        console.log('Profile loaded:', profileData);
        
        // Redirect based on user role after profile is loaded
        if (location.pathname === "/login" || location.pathname === "/") {
          if (profileData.role === "user") {
            console.log('Redirecting user to /hub');
            navigate("/hub");
          } else if (profileData.role === "admin" || profileData.role === "staff") {
            console.log('Redirecting admin/staff to /dashboard');
            navigate("/dashboard");
          }
        }
        
        // Also fetch the barangay data if brgyid is available
        if (profileData.brgyid) {
          fetchBarangayData(profileData.brgyid);
        }
        return;
      }

      // If not found in profiles table
      console.log('No user profile found in profiles table for user ID:', userId);
      toast({
        title: "Profile Not Found",
        description: "Could not find your user profile. Please contact an administrator.",
        variant: "destructive",
      });
      
      // Sign out the user since they don't have a profile
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserProfile(null);
      setCurrentUserId(null);
      navigate("/login");
      
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
      // Update user to offline status before signing out
      if (user?.id) {
        await updateUserOnlineStatus(user.id, false);
      }

      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserProfile(null);
      setCurrentUserId(null);
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
      navigate("/login");
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
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
        
        navigator.sendBeacon('/api/update-offline-status', data);
        
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
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      console.log("Auth state change:", _event, currentSession?.user?.id);
      
      if (_event === 'SIGNED_OUT') {
        // User signed out, update offline status
        if (user?.id) {
          await updateUserOnlineStatus(user.id, false);
        }
        setUser(null);
        setSession(null);
        setUserProfile(null);
        setCurrentUserId(null);
        return;
      }
      
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        setTimeout(() => {
          fetchUserProfile(currentSession.user.id);
        }, 100);
      }
    });

    if (!authInitialized) {
      supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
        console.log("Got initial session:", initialSession?.user?.id);
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        
        if (initialSession?.user) {
          fetchUserProfile(initialSession.user.id);
        }
        
        setLoading(false);
        setAuthInitialized(true);
      }).catch(error => {
        console.error("Error getting session:", error);
        setLoading(false);
        setAuthInitialized(true);
      });
    }

    return () => {
      subscription.unsubscribe();
    };
  }, [authInitialized]);

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
