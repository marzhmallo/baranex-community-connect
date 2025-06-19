import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { ChatbotSettingsProvider } from "@/components/chatbot/ChatbotSettingsContext";
import FloatingChatButton from "@/components/chatbot/FloatingChatButton";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import HubPage from "@/pages/HubPage";
import PublicLayout from "@/layouts/PublicLayout";
import PrivateLayout from "@/layouts/PrivateLayout";
import SettingsPage from "@/pages/SettingsPage";
import UserSettingsPage from "@/components/user/UserSettingsPage";
import BarangayAdminRoute from "@/routes/BarangayAdminRoute";
import UserRoute from "@/routes/UserRoute";
import PublicRoute from "@/routes/PublicRoute";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <Router>
          <AuthProvider>
            <ChatbotSettingsProvider>
              <div className="min-h-screen bg-background">
                <Routes>
                  {/* Public Routes */}
                  <Route element={<PublicLayout />}>
                    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                  </Route>

                  {/* Admin Routes */}
                  <Route path="/dashboard" element={<BarangayAdminRoute><PrivateLayout><DashboardPage /></PrivateLayout></BarangayAdminRoute>} />
                  <Route path="/settings" element={<BarangayAdminRoute><PrivateLayout><SettingsPage /></PrivateLayout></BarangayAdminRoute>} />

                  {/* User Routes */}
                  <Route path="/hub" element={<UserRoute><PrivateLayout><HubPage /></PrivateLayout></UserRoute>} />
                  <Route path="/hub/settings" element={<UserRoute><PrivateLayout><UserSettingsPage /></PrivateLayout></UserRoute>} />

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
