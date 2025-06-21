
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BellRing, Plus } from "lucide-react";
import AnnouncementsList from "@/components/announcements/AnnouncementsList";
import CreateAnnouncementForm from "@/components/announcements/CreateAnnouncementForm";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Announcement } from "@/lib/types/announcements";

const AnnouncementsPage = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: announcements = [], isLoading, refetch } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Announcement[];
    }
  });

  if (showCreateForm) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <BellRing className="h-8 w-8 text-orange-600" />
          <div>
            <h1 className="text-3xl font-bold">Announcements Management</h1>
            <p className="text-muted-foreground">Create and manage community announcements and notifications</p>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Create New Announcement</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateAnnouncementForm onClose={() => setShowCreateForm(false)} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <BellRing className="h-8 w-8 text-orange-600" />
        <div>
          <h1 className="text-3xl font-bold">Announcements Management</h1>
          <p className="text-muted-foreground">Create and manage community announcements and notifications</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Announcement
        </Button>
      </div>

      <AnnouncementsList 
        announcements={announcements}
        isLoading={isLoading}
        refetch={refetch}
      />
    </div>
  );
};

export default AnnouncementsPage;
