
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import Sidebar from "./components/layout/Sidebar";
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

// Loading screen component
const AuthLoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Component to protect admin-only routes
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { userProfile, loading } = useAuth();
  
  if (loading) {
    return <AuthLoadingScreen />;
  }
  
  if (userProfile?.role === "user") {
    return <Navigate to="/hub" replace />;
  }
  
  return <>{children}</>;
};

// Component to protect user-only routes
const UserRoute = ({ children }: { children: React.ReactNode }) => {
  const { userProfile, loading } = useAuth();
  
  if (loading) {
    return <AuthLoadingScreen />;
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
  const isUserRoute = location.pathname === "/hub";
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  useEffect(() => {
    const handleSidebarChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      setIsSidebarCollapsed(customEvent.detail.isCollapsed);
    };
    
    window.addEventListener('sidebarStateChange', handleSidebarChange);
    
    return () => {
      window.removeEventListener('sidebarStateChange', handleSidebarChange);
    };
  }, []);

  // Show loading screen while auth is initializing
  if (loading) {
    return <AuthLoadingScreen />;
  }

  // Prevent any admin UI from showing to users
  const isUserRole = userProfile?.role === "user";
  const showAdminSidebar = !isAuthPage && !isUserRoute && !isUserRole && userProfile?.role !== "user";
  
  return (
    <div className="flex">
      {showAdminSidebar && <Sidebar />}
      
      <div 
        className={`flex-1 transition-all duration-300 ease-in-out ${
          showAdminSidebar ? (isSidebarCollapsed ? "ml-16" : "md:ml-64") : ""
        }`}
      > 
        <Routes>
          <Route path="/login" element={<Auth />} />
          
          {/* Admin/Staff Routes - completely hidden from users */}
          {!isUserRole && (
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
            </>
          )}
          
          {/* User Routes */}
          <Route path="/hub" element={<UserRoute><HomePage /></UserRoute>} />
          
          {/* Shared Routes */}
          <Route path="/profile" element={<ProfilePage />} />
          
          {/* Default redirects based on role */}
          <Route path="/" element={
            isUserRole ? <Navigate to="/hub" replace /> : <Navigate to="/login" replace />
          } />
          
          {/* Catch all - redirect users away from admin routes */}
          <Route path="*" element={
            isUserRole ? <Navigate to="/hub" replace /> : <NotFound />
          } />
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
