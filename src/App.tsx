import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/components/AuthProvider";
import { DashboardDataProvider } from "@/contexts/DashboardDataContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ResidentsPage from "./pages/ResidentsPage";
import HouseholdsPage from "./pages/HouseholdsPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import CalendarPage from "./pages/CalendarPage";
import SettingsPage from "./pages/SettingsPage";
import StatisticsPage from "./pages/StatisticsPage";
import ResidentMoreDetailsPage from "./pages/ResidentMoreDetailsPage";
import HouseholdMoreDetailsPage from "./pages/HouseholdMoreDetailsPage";
import HomePage from "./pages/HomePage";
import OfficialsPage from "./pages/OfficialsPage";
import OfficialDetailsPage from "./pages/OfficialDetailsPage";
import BlotterPage from "./pages/BlotterPage";
import EmergencyResponsePage from "./pages/EmergencyResponsePage";
import FeedbackPage from "./pages/FeedbackPage";
import ForumPage from "./pages/ForumPage";
import NexusPage from "./pages/NexusPage";
import ProfilePage from "./pages/ProfilePage";
import UserProfilePage from "./pages/UserProfilePage";
import UserAccountManagement from "./pages/UserAccountManagement";
import UserFeedbackPage from "./pages/UserFeedbackPage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <DashboardDataProvider>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/residents" element={<ResidentsPage />} />
                  <Route path="/residents/:id" element={<ResidentMoreDetailsPage />} />
                  <Route path="/households" element={<HouseholdsPage />} />
                  <Route path="/households/:id" element={<HouseholdMoreDetailsPage />} />
                  <Route path="/announcements" element={<AnnouncementsPage />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/statistics" element={<StatisticsPage />} />
                  <Route path="/hub" element={<HomePage />} />
                  <Route path="/officials" element={<OfficialsPage />} />
                  <Route path="/officials/:id" element={<OfficialDetailsPage />} />
                  <Route path="/blotter" element={<BlotterPage />} />
                  <Route path="/emergency" element={<EmergencyResponsePage />} />
                  <Route path="/feedback" element={<FeedbackPage />} />
                  <Route path="/forum" element={<ForumPage />} />
                  <Route path="/nexus" element={<NexusPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/user-profile" element={<UserProfilePage />} />
                  <Route path="/user-accounts" element={<UserAccountManagement />} />
                  <Route path="/user-feedback" element={<UserFeedbackPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </DashboardDataProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
