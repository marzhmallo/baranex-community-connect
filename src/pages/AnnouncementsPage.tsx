
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
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Barangay Announcements</h1>
        {userProfile?.role === 'admin' && (
          <Button 
            onClick={toggleCreateForm} 
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {showCreateForm ? 'Cancel' : 'New Announcement'}
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load announcements. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      {showCreateForm && (
        <div className="mb-8">
          <CreateAnnouncementForm 
            onAnnouncementCreated={handleAnnouncementCreated} 
            onCancel={() => setShowCreateForm(false)} 
          />
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
