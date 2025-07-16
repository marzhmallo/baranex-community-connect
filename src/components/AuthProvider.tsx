import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { logUserSignIn, logUserSignOut } from "@/lib/api/activityLogs";

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
  chatbot_enabled?: boolean;
  chatbot_mode?: string;
}

interface UserSettings {
  chatbot_enabled: boolean;
  chatbot_mode: string;
  auto_fill_address_from_admin_barangay: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  userSettings: UserSettings | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  userProfile: null,
  userSettings: null,
  loading: true,
  signOut: async () => {},
  refreshSettings: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasHandledInitialAuth, setHasHandledInitialAuth] = useState(false);
  const [hasLoggedSignIn, setHasLoggedSignIn] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(!document.hidden);
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

  // Fetch user settings from settings table
  const fetchUserSettings = async (userId: string) => {
    try {
      const { data: settings, error } = await supabase
        .from('settings')
        .select('key, value')
        .eq('userid', userId)
        .in('key', ['chatbot_enabled', 'chatbot_mode', 'auto_fill_address_from_admin_barangay']);

      if (error) {
        console.error('Error loading settings:', error);
        // Set defaults on error
        setUserSettings({
          chatbot_enabled: true,
          chatbot_mode: 'offline',
          auto_fill_address_from_admin_barangay: true,
        });
        return;
      }

      // Process settings data
      const settingsMap = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, string>);

      setUserSettings({
        chatbot_enabled: settingsMap.chatbot_enabled === 'true' || settingsMap.chatbot_enabled === undefined,
        chatbot_mode: settingsMap.chatbot_mode || 'offline',
        auto_fill_address_from_admin_barangay: settingsMap.auto_fill_address_from_admin_barangay === 'true' || settingsMap.auto_fill_address_from_admin_barangay === undefined,
      });
    } catch (error) {
      console.error('Error in fetchUserSettings:', error);
      // Set defaults on error
      setUserSettings({
        chatbot_enabled: true,
        chatbot_mode: 'offline',
        auto_fill_address_from_admin_barangay: true,
      });
    }
  };

  const refreshSettings = async () => {
    if (user?.id) {
      await fetchUserSettings(user.id);
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
        
        // Check if barangay requires approval FIRST (is_custom = false)
        if (profileData.brgyid && (profileData.role === "admin" || profileData.role === "staff")) {
          const { data: barangayData, error: barangayError } = await supabase
            .from('barangays')
            .select('is_custom')
            .eq('id', profileData.brgyid)
            .single();

          if (barangayError) {
            console.error('Error checking barangay approval status:', barangayError);
          } else if (barangayData && !barangayData.is_custom) {
            await signOut();
            toast({
              title: "Barangay Pending Approval",
              description: "Your barangay registration is pending approval. Please wait for administrator approval.",
              variant: "destructive",
            });
            return;
          }
        }
        
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
        
        // Fetch user settings after profile is loaded
        await fetchUserSettings(userId);
        
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

  const signOut = async () => {
    try {
      console.log('Starting sign out process...');
      
      // Store current user ID and profile before clearing state
      const currentUserId = user?.id;
      const currentUserProfile = userProfile;
      
      // Log the sign out activity before clearing state
      if (currentUserId && currentUserProfile) {
        console.log('Logging sign out activity...');
        await logUserSignOut(currentUserId, currentUserProfile);
      }
      
      // Clear local state FIRST to prevent any UI issues
      setUser(null);
      setSession(null);
      setUserProfile(null);
      setUserSettings(null);
      setHasHandledInitialAuth(false);
      setHasLoggedSignIn(false);
      
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
      setUserSettings(null);
      setHasHandledInitialAuth(false);
      setHasLoggedSignIn(false);
      
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
        try {
          await updateUserOnlineStatus(user.id, false);
        } catch (error) {
          console.error('Error updating offline status on page close:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user?.id]);

  // Handle visibility changes to prevent redirects when switching tabs
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      console.log('Visibility changed:', isVisible ? 'visible' : 'hidden');
      setIsPageVisible(isVisible);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    console.log("Auth provider initialized");
    let mounted = true;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("Auth state change:", event, currentSession?.user?.id, "Path:", location.pathname, "Visibility:", isPageVisible);
      
      if (!mounted) return;
      
      // Handle all auth events but NEVER redirect except for initial sign-in from login page
      if (event === 'SIGNED_OUT') {
        console.log('User signed out event - clearing state');
        setUser(null);
        setSession(null);
        setUserProfile(null);
        setUserSettings(null);
        setHasHandledInitialAuth(false);
        setHasLoggedSignIn(false);
        setLoading(false);
        return;
      }
      
      // Update session and user for all events
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      // Check if this is a password recovery session
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const recoveryType = hashParams.get('type');
      const isPasswordRecovery = recoveryType === 'recovery';
      
      // ONLY handle redirects for SIGNED_IN event from login page AND only if we haven't already handled initial auth AND page is visible AND NOT password recovery
      if (event === 'SIGNED_IN' && 
          location.pathname === '/login' && 
          !hasHandledInitialAuth && 
          isPageVisible &&
          currentSession?.user &&
          !isPasswordRecovery) {
        
        console.log('Processing SIGNED_IN event from login page - will redirect');
        setHasHandledInitialAuth(true);
        setHasLoggedSignIn(true); // Mark that we've logged this sign-in
        
        setTimeout(async () => {
          if (mounted) {
            await fetchUserProfile(currentSession.user.id);
            
            // Log the sign in activity ONLY for actual SIGNED_IN events
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', currentSession.user.id)
              .maybeSingle();
            
            if (profileData) {
              console.log('Logging sign in activity for actual SIGNED_IN event:', currentSession.user.id);
              await logUserSignIn(currentSession.user.id, profileData);
            }
            
            if (profileData) {
              console.log('Redirecting based on role:', profileData.role);
              if (profileData.role === "user") {
                navigate("/hub");
              } else if (profileData.role === "admin" || profileData.role === "staff") {
                navigate("/dashboard");
              } else if (profileData.role === "glyph") {
                navigate("/echelon");
              } else if (profileData.role === "overseer") {
                navigate("/plaza");
              }
            }
          }
        }, 100);
      } else if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        console.log(`${event} event - updating profile silently, NO REDIRECTS`);
        
        // Only update profile data, never redirect on token refresh or initial session
        if (currentSession?.user && mounted) {
          setTimeout(() => {
            if (mounted) {
              fetchUserProfile(currentSession.user.id);
            }
          }, 100);
        }
      } else if (event === 'SIGNED_IN') {
        console.log('SIGNED_IN event ignored - not from login page or already handled initial auth');
      }
      
      setLoading(false);
    });

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session: initialSession }, error }) => {
      if (!mounted) return;
      
      if (error) {
        console.error("Error getting session:", error);
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.clear();
        setLoading(false);
        return;
      }
      
      // Check if user chose not to be remembered - if so, sign them out
      if (initialSession && !sessionStorage.getItem('rememberMe')) {
        console.log("User did not choose to be remembered - signing out");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }
      
      console.log("Got initial session:", initialSession?.user?.id);
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      
      if (initialSession?.user) {
        await fetchUserProfile(initialSession.user.id);
        
        // ONLY redirect on initial load if on login or root page AND haven't handled initial auth
        // Check if this is a password recovery session
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const recoveryType = hashParams.get('type');
        const isPasswordRecovery = recoveryType === 'recovery';
        
        if ((location.pathname === "/login" || location.pathname === "/") && !hasHandledInitialAuth && !isPasswordRecovery) {
          console.log('Initial load from login/root, checking for redirect...');
          setHasHandledInitialAuth(true);
          
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', initialSession.user.id)
            .maybeSingle();
          
          if (profileData) {
            console.log('Redirecting based on role:', profileData.role);
            if (profileData.role === "user") {
              navigate("/hub");
            } else if (profileData.role === "admin" || profileData.role === "staff") {
              navigate("/dashboard");
            } else if (profileData.role === "glyph") {
              navigate("/echelon");
            } else if (profileData.role === "overseer") {
              navigate("/plaza");
            }
          }
        } else {
          console.log('Already on valid page or already handled auth, no redirect needed. Current path:', location.pathname);
        }
      }
      
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [location.pathname, isPageVisible]); // Include dependencies for proper tracking

  return (
    <AuthContext.Provider value={{ user, session, userProfile, userSettings, loading, signOut, refreshSettings }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
