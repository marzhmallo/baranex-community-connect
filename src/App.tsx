
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import HomePage from "./pages/HomePage";
import ResidentsPage from "./pages/ResidentsPage";
import HouseholdsPage from "./pages/HouseholdsPage";
import OfficalsPage from "./pages/OfficialsPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import CalendarPage from "./pages/CalendarPage";
import BlotterPage from "./pages/BlotterPage";
import EmergencyResponsePage from "./pages/EmergencyResponsePage";
import ForumPage from "./pages/ForumPage";
import FeedbackPage from "./pages/FeedbackPage";
import StatisticsPage from "./pages/StatisticsPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import ResidentMoreDetailsPage from "./pages/ResidentMoreDetailsPage";
import HouseholdMoreDetailsPage from "./pages/HouseholdMoreDetailsPage";
import OfficialDetailsPage from "./pages/OfficialDetailsPage";
import UserAccountManagement from "./pages/UserAccountManagement";
import UserProfilePage from "./pages/UserProfilePage";
import UserFeedbackPage from "./pages/UserFeedbackPage";
import DocumentTemplateEditorPage from "./pages/DocumentTemplateEditorPage";
import DocumentsPage from "./components/documents/DocumentsPage";
import UserDocumentsPage from "./components/user/UserDocumentsPage";
import UserAnnouncementsPage from "./components/user/UserAnnouncementsPage";
import UserCalendarPage from "./components/user/UserCalendarPage";
import UserOfficialDetailsPage from "./components/user/UserOfficialDetailsPage";
import UserOfficialsPage from "./components/user/UserOfficialsPage";
import UserForumPage from "./components/user/UserForumPage";
import UserEmergencyPage from "./components/user/UserEmergencyPage";
import UserSettingsPage from "./components/user/UserSettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/residents" element={<ResidentsPage />} />
                <Route path="/households" element={<HouseholdsPage />} />
                <Route path="/officials" element={<OfficalsPage />} />
                <Route path="/announcements" element={<AnnouncementsPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/blotter" element={<BlotterPage />} />
                <Route path="/emergency" element={<EmergencyResponsePage />} />
                <Route path="/forum" element={<ForumPage />} />
                <Route path="/feedback" element={<FeedbackPage />} />
                <Route path="/statistics" element={<StatisticsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/documents/new" element={<DocumentTemplateEditorPage />} />
                <Route path="/resident/:id" element={<ResidentMoreDetailsPage />} />
                <Route path="/household/:id" element={<HouseholdMoreDetailsPage />} />
                <Route path="/official/:id" element={<OfficialDetailsPage />} />
                <Route path="/user-account" element={<UserAccountManagement />} />
                <Route path="/user-profile" element={<UserProfilePage />} />
                <Route path="/user-feedback" element={<UserFeedbackPage />} />
                <Route path="/user-documents" element={<UserDocumentsPage />} />
                <Route path="/user-announcements" element={<UserAnnouncementsPage />} />
                <Route path="/user-calendar" element={<UserCalendarPage />} />
                <Route path="/user-official/:id" element={<UserOfficialDetailsPage />} />
                <Route path="/user-officials" element={<UserOfficialsPage />} />
                <Route path="/user-forum" element={<UserForumPage />} />
                <Route path="/user-emergency" element={<UserEmergencyPage />} />
                <Route path="/user-settings" element={<UserSettingsPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
