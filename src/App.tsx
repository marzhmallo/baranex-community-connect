
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { DataProvider } from "@/context/DataContext";
import Sidebar from "./components/layout/Sidebar";
import PublicSidebar from "./components/layout/PublicSidebar";
import FloatingChatButton from "./components/chatbot/FloatingChatButton";
import GlobalLoadingScreen from "./components/ui/GlobalLoadingScreen";
import GlobalAuthTransitionOverlay from "./components/ui/GlobalAuthTransitionOverlay";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import HomePage from "./pages/HomePage";
import PublicHomePage from "./pages/PublicHomePage";
import NotFound from "./pages/NotFound";
import ResidentsPage from "./pages/ResidentsPage";
import ResidentMoreDetailsPage from "./pages/ResidentMoreDetailsPage";
import HouseholdPage from "./pages/HouseholdsPage"; 
import HouseholdMoreDetailsPage from "./pages/HouseholdMoreDetailsPage";
import OfficialsPage from "./pages/OfficialsPage"; 
import DocumentsPage from "./components/documents/DocumentsPage";
import BlotterPage from "./pages/BlotterPage";
import FeedbackPage from "./pages/FeedbackPage";
import UserFeedbackPage from "./pages/UserFeedbackPage";
import ProfilePage from "./pages/ProfilePage";
import UserProfilePage from "./pages/UserProfilePage";
import SettingsPage from "./pages/SettingsPage";
import CalendarPage from "./pages/CalendarPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import ForumPage from "./pages/ForumPage";
import StatisticsPage from "./pages/StatisticsPage";
import OfficialDetailsPage from './pages/OfficialDetailsPage';
import EmergencyResponsePage from "./pages/EmergencyResponsePage";
import RiskMapPage from "./pages/RiskMapPage";
import UserAccountManagement from "./pages/UserAccountManagement";
import NexusPage from "./pages/NexusPage";
import UserCalendarPage from "./components/user/UserCalendarPage";
import UserAnnouncementsPage from "./components/user/UserAnnouncementsPage";
import UserOfficialsPage from "./components/user/UserOfficialsPage";
import UserForumPage from "./components/user/UserForumPage";
import UserDocumentsPage from "./components/user/UserDocumentsPage";
import UserEmergencyPage from "./components/user/UserEmergencyPage";
import UserSettingsPage from "./components/user/UserSettingsPage";
import UserOfficialDetailsPage from "./components/user/UserOfficialDetailsPage";
import EchelonPage from "./pages/EchelonPage";
import MunicipalitiesPage from "./pages/MunicipalitiesPage";
import BarangaysPage from "./pages/BarangaysPage";
import PlazaPage from "./pages/PlazaPage";
import ActivityLogPage from "./pages/ActivityLogPage";
import UpdatePasswordPage from "./pages/UpdatePasswordPage";

// Component to protect glyph-only routes
const GlyphRoute = ({ children }: { children: React.ReactNode }) => {
  const { userProfile } = useAuth();
  
  // If not authenticated, this should never happen since we have global auth check
  if (!userProfile) {
    return null;
  }
  
  // If not glyph role, redirect to appropriate dashboard based on role
  if (userProfile.role !== "glyph") {
    if (userProfile.role === "user") {
      return <Navigate to="/hub" replace />;
    } else if (userProfile.role === "admin" || userProfile.role === "staff") {
      return <Navigate to="/dashboard" replace />;
    } else if (userProfile.role === "overseer") {
      return <Navigate to="/plaza" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// Component to protect overseer-only routes
const OverseerRoute = ({ children }: { children: React.ReactNode }) => {
  const { userProfile } = useAuth();
  
  // If not authenticated, this should never happen since we have global auth check
  if (!userProfile) {
    return null;
  }
  
  // If not overseer role, redirect to appropriate dashboard based on role
  if (userProfile.role !== "overseer") {
    if (userProfile.role === "user") {
      return <Navigate to="/hub" replace />;
    } else if (userProfile.role === "admin" || userProfile.role === "staff") {
      return <Navigate to="/dashboard" replace />;
    } else if (userProfile.role === "glyph") {
      return <Navigate to="/echelon" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

// Component to protect admin-only routes
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { userProfile } = useAuth();
  
  // If not authenticated, this should never happen since we have global auth check
  if (!userProfile) {
    return null;
  }
  
  // Redirect users to their hub immediately without showing admin content
  if (userProfile.role === "user") {
    return <Navigate to="/hub" replace />;
  }
  
  // Redirect non-admin roles to appropriate dashboards
  if (userProfile.role !== "admin" && userProfile.role !== "staff") {
    if (userProfile.role === "glyph") {
      return <Navigate to="/echelon" replace />;
    } else if (userProfile.role === "overseer") {
      return <Navigate to="/plaza" replace />;
    }
    return <Navigate to="/hub" replace />;
  }
  
  return <>{children}</>;
};

// Component to protect user-only routes
const UserRoute = ({ children }: { children: React.ReactNode }) => {
  const { userProfile } = useAuth();
  
  // If not authenticated, this should never happen since we have global auth check
  if (!userProfile) {
    return null;
  }
  
  // Redirect admin/staff to their dashboard
  if (userProfile.role === "admin" || userProfile.role === "staff") {
    return <Navigate to="/dashboard" replace />;
  } else if (userProfile.role === "glyph") {
    return <Navigate to="/echelon" replace />;
  } else if (userProfile.role === "overseer") {
    return <Navigate to="/plaza" replace />;
  }
  
  return <>{children}</>;
};

const AppContent = () => {
  const location = useLocation();
  const { userProfile, loading } = useAuth();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/update-password";
  
  // Updated logic to properly detect user routes
  const isUserRoute = userProfile?.role === "user" && (
    location.pathname.startsWith("/hub") || 
    (location.pathname === "/feedback" && userProfile?.role === "user") ||
    (location.pathname === "/profile" && userProfile?.role === "user")
  );
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isPublicSidebarCollapsed, setIsPublicSidebarCollapsed] = useState(false);
  
  useEffect(() => {
    const handleSidebarChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      setIsSidebarCollapsed(customEvent.detail.isCollapsed);
    };
    
    const handlePublicSidebarChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      setIsPublicSidebarCollapsed(customEvent.detail.isCollapsed);
    };
    
    window.addEventListener('sidebarStateChange', handleSidebarChange);
    window.addEventListener('publicSidebarStateChange', handlePublicSidebarChange);
    
    return () => {
      window.removeEventListener('sidebarStateChange', handleSidebarChange);
      window.removeEventListener('publicSidebarStateChange', handlePublicSidebarChange);
    };
  }, []);

  // Show admin sidebar for admin/staff users and not on auth/user pages
  const showAdminSidebar = !isAuthPage && !isUserRoute && 
    userProfile?.role !== "user" && 
    (userProfile?.role === "admin" || userProfile?.role === "staff") &&
    !loading;

  // Show user sidebar for user role and on user pages
  const showUserSidebar = !isAuthPage && isUserRoute && 
    userProfile?.role === "user" && 
    !loading;
  
  // Show loading screen while auth is being determined
  if (loading) {
    return <GlobalLoadingScreen />;
  }
  
  return (
    <DataProvider>
      <GlobalAuthTransitionOverlay />
      <div className="flex">
        {showAdminSidebar && <Sidebar />}
        {showUserSidebar && <PublicSidebar />}
        
        <div 
          className={`flex-1 transition-all duration-300 ease-in-out ${
            showAdminSidebar ? (isSidebarCollapsed ? "ml-16" : "md:ml-64") : 
            showUserSidebar ? (isPublicSidebarCollapsed ? "ml-16" : "md:ml-64") : ""
          }`}
        > 
          <Routes>
            <Route path="/login" element={<Auth />} />
            <Route path="/update-password" element={<UpdatePasswordPage />} />
            
            {/* Admin/Staff Routes - Only render if user has admin/staff role */}
            {(userProfile?.role === "admin" || userProfile?.role === "staff") && (
              <>
                <Route path="/dashboard" element={<AdminRoute><Index /></AdminRoute>} />
                <Route path="/residents" element={<AdminRoute><ResidentsPage /></AdminRoute>} />
                <Route path="/households" element={<AdminRoute><HouseholdPage /></AdminRoute>} />
                <Route path="/residents/:residentId" element={<AdminRoute><ResidentMoreDetailsPage /></AdminRoute>} />
                <Route path="/households/:householdId" element={<AdminRoute><HouseholdMoreDetailsPage /></AdminRoute>} />
                <Route path="/officials" element={<AdminRoute><OfficialsPage /></AdminRoute>} />
                <Route path="/officials/:id" element={<AdminRoute><OfficialDetailsPage /></AdminRoute>} /> 
                <Route path="/documents" element={<AdminRoute><DocumentsPage /></AdminRoute>} />
                <Route path="/blotter" element={<AdminRoute><BlotterPage /></AdminRoute>} />
                <Route path="/feedback" element={<AdminRoute><FeedbackPage /></AdminRoute>} />
                <Route path="/emergency" element={<AdminRoute><EmergencyResponsePage /></AdminRoute>} />
                <Route path="/riskmap" element={<AdminRoute><RiskMapPage /></AdminRoute>} />
                <Route path="/calendar" element={<AdminRoute><CalendarPage /></AdminRoute>} />
                <Route path="/announcements" element={<AdminRoute><AnnouncementsPage /></AdminRoute>} />
                <Route path="/forum" element={<AdminRoute><ForumPage /></AdminRoute>} />
                <Route path="/statistics" element={<AdminRoute><StatisticsPage /></AdminRoute>} />
                <Route path="/settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />
                <Route path="/profile" element={<AdminRoute><ProfilePage /></AdminRoute>} />
                <Route path="/management" element={<AdminRoute><UserAccountManagement /></AdminRoute>} />
                <Route path="/nexus" element={<AdminRoute><NexusPage /></AdminRoute>} />
                <Route path="/activitylog" element={<AdminRoute><ActivityLogPage /></AdminRoute>} />
              </>
            )}
            
            {/* User Routes */}
            <Route path="/hub" element={<UserRoute><HomePage /></UserRoute>} />
            <Route path="/hub/calendar" element={<UserRoute><UserCalendarPage /></UserRoute>} />
            <Route path="/hub/announcements" element={<UserRoute><UserAnnouncementsPage /></UserRoute>} />
            <Route path="/hub/officials" element={<UserRoute><UserOfficialsPage /></UserRoute>} />
            <Route path="/hub/officials/:id" element={<UserRoute><OfficialDetailsPage /></UserRoute>} />
            <Route path="/hub/user-officials/:id" element={<UserRoute><UserOfficialDetailsPage /></UserRoute>} />
            <Route path="/hub/forum" element={<UserRoute><UserForumPage /></UserRoute>} />
            <Route path="/hub/documents" element={<UserRoute><UserDocumentsPage /></UserRoute>} />
            <Route path="/hub/emergency" element={<UserRoute><UserEmergencyPage /></UserRoute>} />
            <Route path="/hub/settings" element={<UserRoute><UserSettingsPage /></UserRoute>} />
            <Route path="/feedback" element={<UserRoute><UserFeedbackPage /></UserRoute>} />
            <Route path="/profile" element={<UserRoute><UserProfilePage /></UserRoute>} />
            
            {/* Glyph-only Routes - Always available for proper redirection */}
            <Route path="/echelon" element={<GlyphRoute><EchelonPage /></GlyphRoute>} />
            <Route path="/municipalities" element={<GlyphRoute><MunicipalitiesPage /></GlyphRoute>} />
            <Route path="/barangays" element={<GlyphRoute><BarangaysPage /></GlyphRoute>} />
            
            {/* Overseer-only Routes - Always available for proper redirection */}
            <Route path="/plaza" element={<OverseerRoute><PlazaPage /></OverseerRoute>} />
            
            {/* Public Routes - Available to everyone */}
            <Route path="/public/announcements" element={<UserAnnouncementsPage />} />
            <Route path="/public/events" element={<UserCalendarPage />} />
            <Route path="/public/officials" element={<UserOfficialsPage />} />
            <Route path="/public/officials/:id" element={<UserOfficialDetailsPage />} />
            <Route path="/public/emergency" element={<UserEmergencyPage />} />
            <Route path="/public/forum" element={<UserForumPage />} />
            
            {/* Default route - public home for non-authenticated, dashboard for authenticated */}
            <Route path="/" element={
              userProfile ? (
                userProfile.role === "user" ? <Navigate to="/hub" replace /> :
                userProfile.role === "admin" || userProfile.role === "staff" ? <Navigate to="/dashboard" replace /> :
                userProfile.role === "glyph" ? <Navigate to="/echelon" replace /> :
                userProfile.role === "overseer" ? <Navigate to="/plaza" replace /> :
                <Navigate to="/login" replace />
              ) : (
                <PublicHomePage />
              )
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
        
        {/* Show chatbot only when user is authenticated and not on login page */}
        {!isAuthPage && userProfile && <FloatingChatButton />}
      </div>
    </DataProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="baranex-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
