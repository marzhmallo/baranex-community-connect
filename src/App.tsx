
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import Sidebar from "./components/layout/Sidebar";
import PublicSidebar from "./components/layout/PublicSidebar";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import HomePage from "./pages/HomePage";
import NotFound from "./pages/NotFound";
import ResidentsPage from "./pages/ResidentsPage";
import ResidentMoreDetailsPage from "./pages/ResidentMoreDetailsPage";
import HouseholdPage from "./pages/HouseholdsPage"; 
import HouseholdMoreDetailsPage from "./pages/HouseholdMoreDetailsPage";
import OfficialsPage from "./pages/OfficialsPage"; 
import DocumentsPage from "./components/documents/DocumentsPage";
import ProfilePage from "./pages/ProfilePage";
import UserProfilePage from "./pages/UserProfilePage";
import SettingsPage from "./pages/SettingsPage";
import CalendarPage from "./pages/CalendarPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import ForumPage from "./pages/ForumPage";
import OfficialDetailsPage from './pages/OfficialDetailsPage';

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
  const { userProfile, loading } = useAuth();
  
  // Show loading while authentication is being determined
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Redirect users to their hub immediately without showing admin content
  if (userProfile?.role === "user") {
    return <Navigate to="/hub" replace />;
  }
  
  // Redirect non-admin roles to login if not admin/staff
  if (userProfile && userProfile.role !== "admin" && userProfile.role !== "staff") {
    return <Navigate to="/hub" replace />;
  }
  
  return <>{children}</>;
};

// Component to protect user-only routes
const UserRoute = ({ children }: { children: React.ReactNode }) => {
  const { userProfile, loading } = useAuth();
  
  // Show loading while authentication is being determined
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (userProfile?.role === "admin" || userProfile?.role === "staff") {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const AppContent = () => {
  const location = useLocation();
  const { userProfile, loading } = useAuth();
  const isAuthPage = location.pathname === "/login";
  const isUserRoute = location.pathname.startsWith("/hub") || (location.pathname === "/profile" && userProfile?.role === "user");
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
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
              <Route path="/calendar" element={<AdminRoute><CalendarPage /></AdminRoute>} />
              <Route path="/announcements" element={<AdminRoute><AnnouncementsPage /></AdminRoute>} />
              <Route path="/forum" element={<AdminRoute><ForumPage /></AdminRoute>} />
              <Route path="/settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />
              <Route path="/profile" element={<AdminRoute><ProfilePage /></AdminRoute>} />
            </>
          )}
          
          {/* User Routes */}
          <Route path="/hub" element={<UserRoute><HomePage /></UserRoute>} />
          <Route path="/profile" element={<UserRoute><UserProfilePage /></UserRoute>} />
          
          {/* Default redirects - redirect to login instead of dashboard */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
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
