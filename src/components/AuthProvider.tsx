
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
  const [profileFetched, setProfileFetched] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch user profile data from profiles table only
  const fetchUserProfile = async (userId: string) => {
    if (profileFetched) return;
    
    console.log('Fetching user profile for:', userId);
    setProfileFetched(true);
    
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
        setLoading(false);
        return;
      }

      if (profileData) {
        console.log('User found in profiles table:', profileData);
        
        if (profileData.status === "pending") {
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          setUserProfile(null);
          setProfileFetched(false);
          toast({
            title: "Account Pending Approval",
            description: "Your account is pending approval from your barangay administrator.",
            variant: "destructive",
          });
          navigate("/login");
          setLoading(false);
          return;
        }

        setUserProfile(profileData as UserProfile);
        console.log('Profile loaded:', profileData);
        
        if (location.pathname === "/login") {
          if (profileData.role === "user") {
            navigate("/hub");
          } else {
            navigate("/dashboard");
          }
        }
        
        if (profileData.brgyid) {
          fetchBarangayData(profileData.brgyid);
        }
      } else {
        console.log('No user profile found in profiles table for user ID:', userId);
        toast({
          title: "Profile Not Found",
          description: "Could not find your user profile. Please contact an administrator.",
          variant: "destructive",
        });
        
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setUserProfile(null);
        setProfileFetched(false);
        navigate("/login");
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error in fetchUserProfile:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching your profile.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };
  
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
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserProfile(null);
      setProfileFetched(false);
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
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("Auth state change:", event, currentSession?.user?.id);
      
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        setUserProfile(null);
        setProfileFetched(false);
        setLoading(false);
        return;
      }
      
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user && !profileFetched) {
        fetchUserProfile(currentSession.user.id);
      } else if (!currentSession?.user) {
        setLoading(false);
      }
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log("Got initial session:", initialSession?.user?.id);
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      
      if (initialSession?.user && !profileFetched) {
        fetchUserProfile(initialSession.user.id);
      } else {
        setLoading(false);
      }
    }).catch(error => {
      console.error("Error getting session:", error);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handle redirects based on auth status and role
  useEffect(() => {
    if (loading) return;

    if (!session && !location.pathname.includes("/login")) {
      navigate("/login");
    }
  }, [session, loading, location.pathname, navigate]);

  return (
    <AuthContext.Provider value={{ user, session, userProfile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
