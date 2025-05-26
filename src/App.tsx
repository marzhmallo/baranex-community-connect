
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import Sidebar from "./components/layout/Sidebar";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
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
import HomePage from "./pages/HomePage";

// Initialize the query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
});

// AppContent component to handle sidebar conditional rendering
const AppContent = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === "/auth";
  const isHomePage = location.pathname === "/home";
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Listen for custom sidebar state change events
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
  
  return (
    <AuthProvider>
      <div className="flex">
        {/* Only render sidebar when NOT on auth page and NOT on home page */}
        {!isAuthPage && !isHomePage && <Sidebar />}
        
        <div 
          className={`flex-1 transition-all duration-300 ease-in-out ${
            !isAuthPage && !isHomePage ? (isSidebarCollapsed ? "ml-16" : "md:ml-64") : ""
          }`}
        > 
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/dashboard" element={<Index />} />
            <Route path="/" element={<Index />} />
            <Route path="/residents" element={<ResidentsPage />} />
            <Route path="/households" element={<HouseholdPage />} />
            <Route path="/residents/:residentId" element={<ResidentMoreDetailsPage />} />
            <Route path="/households/:householdId" element={<HouseholdMoreDetailsPage />} />
            <Route path="/officials" element={<OfficialsPage />} />
            <Route path="/officials/:id" element={<OfficialDetailsPage />} /> 
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/announcements" element={<AnnouncementsPage />} />
            <Route path="/forum" element={<ForumPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </AuthProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="baranex-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
