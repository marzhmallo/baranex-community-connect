
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from "@/components/theme/ThemeProvider"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster"
import DashboardPage from './pages/DashboardPage';
import OfficialsPage from './pages/OfficialsPage';
import ResidentsPage from './pages/ResidentsPage';
import HouseholdsPage from './pages/HouseholdsPage';
import SettingsPage from './pages/SettingsPage';
import UserProfilePage from './pages/UserProfilePage';
import LoginPage from './pages/LoginPage';
import { AuthProvider } from './components/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import DocumentsPage from './components/documents/DocumentsPage';
import TemplateEditor from "@/components/documents/TemplateEditor";
import DocumentPreviewPage from "@/pages/DocumentPreviewPage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="baranex-ui-theme">
        <Router>
          <AuthProvider>
            <Toaster />
            <div className="min-h-screen bg-background">
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/officials" element={<ProtectedRoute><OfficialsPage /></ProtectedRoute>} />
                <Route path="/residents" element={<ProtectedRoute><ResidentsPage /></ProtectedRoute>} />
                <Route path="/households" element={<ProtectedRoute><HouseholdsPage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
                <Route path="/documents" element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />
                
                <Route path="/documents/new" element={<TemplateEditor />} />
                <Route path="/documents/preview" element={<DocumentPreviewPage />} />
              </Routes>
            </div>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
