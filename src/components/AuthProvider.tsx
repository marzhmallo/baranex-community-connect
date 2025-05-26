
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
  
  // Clear profile fetched flag when user changes
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch user profile data from Supabase
  const fetchUserProfile = async (userId: string) => {
    // Skip if we're trying to fetch the same user repeatedly
    if (currentUserId === userId && userProfile !== null) return;
    
    console.log('Fetching user profile for:', userId);
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
          setCurrentUserId(null);
          toast({
            title: "Account Pending Approval",
            description: "Your account is pending approval from your barangay administrator.",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }

        setUserProfile(data as UserProfile);
        setCurrentUserId(userId);
        console.log('User profile loaded:', data);
        
        // Also fetch the barangay data if brgyid is available
        if (data.brgyid) {
          fetchBarangayData(data.brgyid);
        }
      } else {
        console.log('No user profile found');
        toast({
          title: "Profile Not Found",
          description: "Could not find your user profile. Please contact an administrator.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Error in fetchUserProfile:', err);
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

  useEffect(() => {
    console.log("Auth provider initialized");
    
    // Set up auth state listener FIRST to avoid race conditions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      console.log("Auth state change:", _event, currentSession?.user?.id);
      
      if (_event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        setUserProfile(null);
        setCurrentUserId(null);
        return;
      }
      
      // Update session state
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      // Fetch profile if we have a user and session
      if (currentSession?.user) {
        // Wait a moment before fetching profile to avoid race conditions
        setTimeout(() => {
          fetchUserProfile(currentSession.user.id);
        }, 100);
      }
    });

    // THEN check for existing session
    if (!authInitialized) {
      supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
        console.log("Got initial session:", initialSession?.user?.id);
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        
        if (initialSession?.user) {
          // Explicitly fetch profile for existing session
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

  // Handle redirects based on auth status
  useEffect(() => {
    if (loading) return; // Don't redirect while still loading

    if (!session && !location.pathname.includes("/login")) {
      // User is not logged in and trying to access a protected route
      navigate("/login");
    } else if (session && location.pathname === "/login") {
      // User is logged in and trying to access login page
      navigate("/dashboard");
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
