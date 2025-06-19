
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { ChatbotSettingsProvider } from "@/components/chatbot/ChatbotSettingsContext";
import FloatingChatButton from "@/components/chatbot/FloatingChatButton";
import Auth from "@/pages/Auth";
import Dashboard from "@/components/dashboard/Dashboard";
import HubPage from "@/pages/HubPage";
import SettingsPage from "@/pages/SettingsPage";
import UserSettingsPage from "@/components/user/UserSettingsPage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <Router>
          <AuthProvider>
            <ChatbotSettingsProvider>
              <div className="min-h-screen bg-background">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<Auth />} />

                  {/* Admin Routes */}
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/settings" element={<SettingsPage />} />

                  {/* User Routes */}
                  <Route path="/hub" element={<HubPage />} />
                  <Route path="/hub/settings" element={<UserSettingsPage />} />

                  {/* Home Route - Redirect based on auth status */}
                  <Route path="/" element={<Navigate to="/login" />} />

                  {/* No Match Route */}
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
                <FloatingChatButton />
              </div>
              <Toaster />
            </ChatbotSettingsProvider>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
