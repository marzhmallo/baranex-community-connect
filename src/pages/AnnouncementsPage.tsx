
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import AnnouncementsList from '@/components/announcements/AnnouncementsList';
import CreateAnnouncementForm from '@/components/announcements/CreateAnnouncementForm';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  audience: string;
  is_pinned: boolean;
  is_public: boolean;
  photo_url?: string;
  attachment_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  brgyid: string;
  authorName: string; // Added for UI display
}

const AnnouncementsPage = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Fetch announcements from Supabase
  const { data: announcements, isLoading, error, refetch } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      try {
        // Fetch announcements
        const { data: announcementsData, error: announcementsError } = await supabase
          .from('announcements')
          .select('*')
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false });

        if (announcementsError) throw announcementsError;

        // Fetch user profiles to get author names
        const userIds = [...new Set(announcementsData.map(a => a.created_by))];
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, firstname, lastname')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        // Create a map of user IDs to names
        const userMap = profilesData.reduce((acc, user) => {
          acc[user.id] = `${user.firstname} ${user.lastname}`;
          return acc;
        }, {});

        // Add author names to announcements
        const announcementsWithAuthors = announcementsData.map(announcement => ({
          ...announcement,
          authorName: userMap[announcement.created_by] || 'Unknown User'
        }));

        return announcementsWithAuthors;
      } catch (error) {
        console.error('Error fetching announcements:', error);
        throw error;
      }
    }
  });

  const toggleCreateForm = () => setShowCreateForm(!showCreateForm);

  const handleAnnouncementCreated = () => {
    setShowCreateForm(false);
    refetch();
    toast({
      title: "Announcement Created",
      description: "Your announcement has been published successfully."
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-gradient-to-br from-indigo-50 to-emerald-50 min-h-screen">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-primary-800 mb-2">Barangay Public Service Announcements</h1>
        <p className="text-gray-600 text-lg">Stay informed with the latest updates from your local barangay</p>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-white rounded-xl shadow-md p-4">
        <div className="relative w-full">
          <input 
            type="text" 
            placeholder="Search announcements..." 
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300" 
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select className="bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">All Categories</option>
            <option value="emergency">Emergency</option>
            <option value="health">Health</option>
            <option value="community">Community</option>
            <option value="maintenance">Maintenance</option>
            <option value="education">Education</option>
            <option value="waste">Waste Management</option>
          </select>
          
          <select className="bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">All Audiences</option>
            <option value="residents">All Residents</option>
            <option value="seniors">Senior Citizens</option>
            <option value="parents">Parents</option>
            <option value="youth">Youth</option>
            <option value="businesses">Business Owners</option>
          </select>
        </div>
      </div>

      {userProfile?.role === 'admin' && (
        <button 
          onClick={toggleCreateForm}
          className="fixed bottom-6 right-6 bg-primary-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-primary-700 transition-colors duration-300 group z-10"
        >
          <Plus className="text-2xl group-hover:scale-110 transition-transform duration-300" />
        </button>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load announcements. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 z-20 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <CreateAnnouncementForm 
              onAnnouncementCreated={handleAnnouncementCreated} 
              onCancel={() => setShowCreateForm(false)} 
            />
          </div>
        </div>
      )}

      <AnnouncementsList 
        announcements={announcements || []} 
        isLoading={isLoading} 
        refetch={refetch}
      />
    </div>
  );
};

export default AnnouncementsPage;
