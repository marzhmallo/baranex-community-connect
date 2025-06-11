
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { AuthProvider } from '@/components/AuthProvider';

// Import pages
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import HomePage from '@/pages/HomePage';
import ResidentsPage from '@/pages/ResidentsPage';
import HouseholdsPage from '@/pages/HouseholdsPage';
import OfficialsPage from '@/pages/OfficialsPage';
import OfficialDetailsPage from '@/pages/OfficialDetailsPage';
import DocumentsPage from '@/components/documents/DocumentsPage';
import AnnouncementsPage from '@/pages/AnnouncementsPage';
import CalendarPage from '@/pages/CalendarPage';
import BlotterPage from '@/pages/BlotterPage';
import EmergencyResponsePage from '@/pages/EmergencyResponsePage';
import ForumPage from '@/pages/ForumPage';
import FeedbackPage from '@/pages/FeedbackPage';
import ProfilePage from '@/pages/ProfilePage';
import SettingsPage from '@/pages/SettingsPage';
import NotFound from '@/pages/NotFound';
import ResidentMoreDetailsPage from '@/pages/ResidentMoreDetailsPage';
import HouseholdMoreDetailsPage from '@/pages/HouseholdMoreDetailsPage';
import UserAccountManagement from '@/pages/UserAccountManagement';
import UserProfilePage from '@/pages/UserProfilePage';
import UserFeedbackPage from '@/pages/UserFeedbackPage';

// Import user components
import UserAnnouncementsPage from '@/components/user/UserAnnouncementsPage';
import UserCalendarPage from '@/components/user/UserCalendarPage';
import UserDocumentsPage from '@/components/user/UserDocumentsPage';
import UserEmergencyPage from '@/components/user/UserEmergencyPage';
import UserForumPage from '@/components/user/UserForumPage';
import UserOfficialsPage from '@/components/user/UserOfficialsPage';
import UserOfficialDetailsPage from '@/components/user/UserOfficialDetailsPage';
import UserSettingsPage from '@/components/user/UserSettingsPage';

import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-background">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/residents" element={<ResidentsPage />} />
                <Route path="/residents/:id" element={<ResidentMoreDetailsPage />} />
                <Route path="/households" element={<HouseholdsPage />} />
                <Route path="/households/:id" element={<HouseholdMoreDetailsPage />} />
                <Route path="/officials" element={<OfficialsPage />} />
                <Route path="/officials/:id" element={<OfficialDetailsPage />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/announcements" element={<AnnouncementsPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/blotter" element={<BlotterPage />} />
                <Route path="/emergency" element={<EmergencyResponsePage />} />
                <Route path="/forum" element={<ForumPage />} />
                <Route path="/feedback" element={<FeedbackPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/account-management" element={<UserAccountManagement />} />
                <Route path="/user-profile" element={<UserProfilePage />} />
                <Route path="/user-feedback" element={<UserFeedbackPage />} />
                
                {/* User routes */}
                <Route path="/hub/announcements" element={<UserAnnouncementsPage />} />
                <Route path="/hub/calendar" element={<UserCalendarPage />} />
                <Route path="/hub/documents" element={<UserDocumentsPage />} />
                <Route path="/hub/emergency" element={<UserEmergencyPage />} />
                <Route path="/hub/forum" element={<UserForumPage />} />
                <Route path="/hub/officials" element={<UserOfficialsPage />} />
                <Route path="/user-officials/:id" element={<UserOfficialDetailsPage />} />
                <Route path="/hub/settings" element={<UserSettingsPage />} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Toaster />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
