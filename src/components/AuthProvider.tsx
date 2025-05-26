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
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch user profile data from appropriate table based on role
  const fetchUserProfile = async (userId: string) => {
    if (currentUserId === userId && userProfile !== null) return;
    
    console.log('Fetching user profile for:', userId);
    try {
      // First try profiles table (for admin/staff)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileData) {
        // Found in profiles table
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
          navigate("/auth");
          return;
        }

        setUserProfile(profileData as UserProfile);
        setCurrentUserId(userId);
        console.log('Profile loaded from profiles table:', profileData);
        
        if (profileData.brgyid) {
          fetchBarangayData(profileData.brgyid);
        }
        return;
      }

      // If not found in profiles, try users table (for regular users)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (userData) {
        // Found in users table
        if (userData.status === "pending") {
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
          navigate("/auth");
          return;
        }

        // Convert users table data to UserProfile format
        const userProfileData: UserProfile = {
          id: userData.id,
          brgyid: userData.brgyid,
          email: userData.email,
          role: userData.role,
          username: userData.username,
          firstname: userData.firstname,
          lastname: userData.lastname,
          middlename: userData.middlename,
          phone: userData.phone?.toString(),
          status: userData.status,
          created_at: userData.created_at,
        };

        setUserProfile(userProfileData);
        setCurrentUserId(userId);
        console.log('Profile loaded from users table:', userProfileData);
        
        if (userData.brgyid) {
          fetchBarangayData(userData.brgyid);
        }
        return;
      }

      // No profile found in either table
      console.log('No user profile found in either table');
      toast({
        title: "Profile Not Found",
        description: "Could not find your user profile. Please contact an administrator.",
        variant: "destructive",
      });
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

  // Handle redirects based on auth status and user role
  useEffect(() => {
    if (loading) return; // Don't redirect while still loading

    if (!session && !location.pathname.includes("/auth")) {
      navigate("/auth");
    } else if (session && location.pathname === "/auth") {
      // Redirect based on user role
      if (userProfile?.role === 'admin' || userProfile?.role === 'staff') {
        navigate("/dashboard");
      } else {
        navigate("/home");
      }
    } else if (session && userProfile) {
      // Prevent admin/staff from accessing /home
      if ((userProfile.role === 'admin' || userProfile.role === 'staff') && location.pathname === "/home") {
        navigate("/dashboard");
      }
      // Prevent regular users from accessing admin dashboard
      else if (userProfile.role === 'user' && location.pathname === "/dashboard") {
        navigate("/home");
      }
    }
  }, [session, loading, location.pathname, navigate, userProfile?.role]);

  return (
    <AuthContext.Provider value={{ user, session, userProfile, loading, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
