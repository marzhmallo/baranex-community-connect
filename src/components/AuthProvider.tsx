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

  // Fetch user profile data from both profiles and users tables
  const fetchUserProfile = async (userId: string) => {
    // Skip if we're trying to fetch the same user repeatedly
    if (currentUserId === userId && userProfile !== null) return;
    
    console.log('Fetching user profile for:', userId);
    try {
      // First try to fetch from profiles table (for admin/staff)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching from profiles table:', profileError);
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

        setUserProfile(profileData as UserProfile);
        setCurrentUserId(userId);
        console.log('Admin/Staff profile loaded:', profileData);
        
        // Redirect admin/staff to dashboard
        if (location.pathname === "/login") {
          navigate("/dashboard");
        }
        
        // Also fetch the barangay data if brgyid is available
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

      if (userError) {
        console.error('Error fetching from users table:', userError);
        toast({
          title: "Database Error",
          description: "Could not fetch user profile. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (userData) {
        console.log('User found in users table:', userData);
        
        // Check if user status is pending
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
          navigate("/login");
          return;
        }

        // Transform users table data to match UserProfile interface
        const transformedUserData: UserProfile = {
          id: userData.id,
          brgyid: userData.brgyid,
          email: userData.email,
          role: userData.role,
          username: userData.username,
          firstname: userData.firstname,
          lastname: userData.lastname,
          middlename: userData.middlename,
          phone: userData.phone?.toString(), // Convert numeric to string if needed
          status: userData.status,
          created_at: userData.created_at,
        };

        setUserProfile(transformedUserData);
        setCurrentUserId(userId);
        console.log('Regular user profile loaded:', transformedUserData);
        
        // Redirect regular users to home
        if (location.pathname === "/login") {
          navigate("/home");
        }
        
        // Also fetch the barangay data if brgyid is available
        if (userData.brgyid) {
          fetchBarangayData(userData.brgyid);
        }
        return;
      }

      // If not found in either table
      console.log('No user profile found in either table for user ID:', userId);
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
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      console.log("Auth state change:", _event, currentSession?.user?.id);
      
      if (_event === 'SIGNED_OUT') {
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

    if (!session && !location.pathname.includes("/login")) {
      navigate("/login");
    } else if (session && location.pathname === "/login") {
      // Redirect based on user role
      if (userProfile?.role === "user") {
        navigate("/home");
      } else {
        navigate("/dashboard");
      }
    }
  }, [session, loading, location.pathname, navigate, userProfile]);

  return (
    <AuthContext.Provider value={{ user, session, userProfile, loading, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
