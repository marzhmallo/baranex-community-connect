

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
  const [initialRedirectDone, setInitialRedirectDone] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch user profile data from Supabase
  const fetchUserProfile = async (userId: string) => {
    console.log('Fetching user profile for:', userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      if (data) {
        // Check if user status is pending
        if (data.status === "pending") {
          // Sign out the user if status is pending
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          setUserProfile(null);
          toast({
            title: "Account Pending Approval",
            description: "Your account is pending approval from your barangay administrator.",
            variant: "destructive",
          });
          navigate("/auth");
          return null;
        }

        setUserProfile(data as UserProfile);
        console.log('User profile loaded:', data);
        
        // Also fetch the barangay data if brgyid is available
        if (data.brgyid) {
          fetchBarangayData(data.brgyid);
        }
        
        return data as UserProfile;
      } else {
        console.log('No user profile found');
        toast({
          title: "Profile Not Found",
          description: "Could not find your user profile. Please contact an administrator.",
          variant: "destructive",
        });
        return null;
      }
    } catch (err) {
      console.error('Error in fetchUserProfile:', err);
      return null;
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
        // Store barangay data in context if needed
      }
    } catch (err) {
      console.error('Error in fetchBarangayData:', err);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserProfile(null);
      setInitialRedirectDone(false);
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
      navigate("/auth");
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    console.log("Auth provider initialized");
    
    let mounted = true;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("Auth state change:", event, currentSession?.user?.id);
      
      if (!mounted) return;
      
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        setUserProfile(null);
        setInitialRedirectDone(false);
        setLoading(false);
        return;
      }
      
      // Update session and user state
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      // Fetch profile if we have a user
      if (currentSession?.user) {
        const profile = await fetchUserProfile(currentSession.user.id);
        
        // Handle initial redirect after profile is loaded
        if (profile && !initialRedirectDone && !location.pathname.includes("/auth")) {
          setInitialRedirectDone(true);
          if (profile.role === 'admin') {
            navigate("/dashboard", { replace: true });
          } else {
            navigate("/home", { replace: true });
          }
        }
      }
      
      setLoading(false);
    });

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        console.log("Got initial session:", initialSession?.user?.id);
        
        if (!mounted) return;
        
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        
        if (initialSession?.user) {
          const profile = await fetchUserProfile(initialSession.user.id);
          
          // Handle initial redirect for existing session
          if (profile && !initialRedirectDone && !location.pathname.includes("/auth")) {
            setInitialRedirectDone(true);
            if (profile.role === 'admin') {
              navigate("/dashboard", { replace: true });
            } else {
              navigate("/home", { replace: true });
            }
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error getting session:", error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Remove authInitialized dependency

  // Handle redirects based on auth status (for users trying to access protected routes)
  useEffect(() => {
    if (loading || initialRedirectDone) return; // Don't redirect while still loading or if initial redirect is done

    if (!session && !location.pathname.includes("/auth")) {
      // User is not logged in and trying to access a protected route
      navigate("/auth");
    }
  }, [session, loading, location.pathname, navigate, initialRedirectDone]);

  return (
    <AuthContext.Provider value={{ user, session, userProfile, loading, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

