
import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";

interface UserProfile {
  id: string;
  brgyid?: string;
  email?: string;
  role?: string;
  // Add other profile fields as needed
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  session: null, 
  userProfile: null 
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch user profile data from Supabase
  const fetchUserProfile = async (userId: string) => {
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
        setUserProfile(data as UserProfile);
        console.log('User profile loaded:', data);
      } else {
        // Try to fetch profile where adminid is the user's ID
        const { data: adminData, error: adminError } = await supabase
          .from('profiles')
          .select('*')
          .eq('adminid', userId)
          .maybeSingle();

        if (adminError) {
          console.error('Error fetching admin profile:', adminError);
          return;
        }

        if (adminData) {
          setUserProfile(adminData as UserProfile);
          console.log('Admin profile loaded:', adminData);
        } else {
          console.log('No user profile found');
        }
      }
    } catch (err) {
      console.error('Error in fetchUserProfile:', err);
    }
  };

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      
      setIsLoading(false);
      
      // Handle redirects based on auth status and current route
      handleAuthRedirects(session, location.pathname);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
      }
      
      // Handle redirects when auth state changes
      handleAuthRedirects(session, location.pathname);
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  // Helper function to handle auth-based redirects
  const handleAuthRedirects = (session: Session | null, pathname: string) => {
    if (session) {
      // User is logged in
      if (pathname === "/auth") {
        // Redirect away from auth page if already logged in
        navigate("/");
      }
    } else {
      // User is not logged in
      if (pathname !== "/auth") {
        // Redirect to auth page if not logged in and trying to access protected routes
        navigate("/auth");
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, userProfile }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
