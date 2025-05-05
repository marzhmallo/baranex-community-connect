
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Watch for sidebar collapsed state changes from DOM
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.target instanceof Element) {
          const sidebarWidth = document.querySelector('aside')?.getBoundingClientRect().width;
          setIsSidebarCollapsed(sidebarWidth !== undefined && sidebarWidth < 100);
        }
      });
    });
    
    const sidebar = document.querySelector('aside');
    if (sidebar) {
      observer.observe(sidebar, { attributes: true });
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <AuthProvider>
      <div className="flex">
        {/* Only render sidebar when NOT on auth page */}
        {!isAuthPage && <Sidebar />}
        
        <div 
          className={`flex-1 transition-all duration-300 ease-in-out ${
            !isAuthPage ? (isSidebarCollapsed ? "ml-16" : "md:ml-64") : ""
          }`}
        > 
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Index />} />
            <Route path="/residents" element={<ResidentsPage />} />
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
