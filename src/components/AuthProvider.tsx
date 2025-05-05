
import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  session: Session | null;
}

const AuthContext = createContext<AuthContextType>({ user: null, session: null });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
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
    <AuthContext.Provider value={{ user, session }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
