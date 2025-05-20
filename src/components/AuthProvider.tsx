
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
  const [authInitialized, setAuthInitialized] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Track if profile has been fetched to prevent repeated fetches
  const [profileFetched, setProfileFetched] = useState(false);

  // Fetch user profile data from Supabase
  const fetchUserProfile = async (userId: string) => {
    // Skip if profile has already been fetched for this user session
    if (profileFetched) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
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
          return;
        }

        setUserProfile(data as UserProfile);
        setProfileFetched(true);
        console.log('User profile loaded:', data);
      } else {
        console.log('No user profile found');
      }
    } catch (err) {
      console.error('Error in fetchUserProfile:', err);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserProfile(null);
      setProfileFetched(false);
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
    // Debounce flag to prevent multiple simultaneous profile fetches
    let isFetchingProfile = false;
    
    // Set up auth state listener FIRST to avoid race conditions
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (_event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        setUserProfile(null);
        setProfileFetched(false);
        return;
      }
      
      // Don't update state needlessly if session hasn't changed
      if (currentSession?.access_token === session?.access_token) {
        return;
      }
      
      // Update session state
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      // Fetch profile using setTimeout to avoid circular Supabase client calls
      if (currentSession?.user && !isFetchingProfile) {
        isFetchingProfile = true;
        setTimeout(() => {
          fetchUserProfile(currentSession.user.id).finally(() => {
            isFetchingProfile = false;
          });
        }, 100);
      }
    });

    // THEN check for existing session
    if (!authInitialized) {
      supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        
        if (initialSession?.user) {
          setTimeout(() => {
            fetchUserProfile(initialSession.user.id);
          }, 100);
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

  // Handle redirects based on auth status
  useEffect(() => {
    if (loading) return; // Don't redirect while still loading

    if (!session && !location.pathname.includes("/auth")) {
      // User is not logged in and trying to access a protected route
      navigate("/auth");
    } else if (session && location.pathname === "/auth") {
      // User is logged in and trying to access auth page
      navigate("/");
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
