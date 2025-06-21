
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus, Search } from "lucide-react";
import ResidentsList from "@/components/residents/ResidentsList";
import ResidentForm from "@/components/residents/ResidentForm";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

const ResidentsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { userProfile } = useAuth();

  const { data: residents, isLoading, refetch } = useQuery({
    queryKey: ['residents', userProfile?.brgyid],
    queryFn: async () => {
      if (!userProfile?.brgyid) return [];
      
      const { data, error } = await supabase
        .from('residents')
        .select('*')
        .eq('brgyid', userProfile.brgyid)
        .order('last_name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userProfile?.brgyid
  });

  const filteredResidents = residents?.filter(resident =>
    `${resident.first_name} ${resident.last_name} ${resident.middle_name || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  ) || [];

  if (showForm) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Residents Management</h1>
            <p className="text-muted-foreground">Manage and track all residents in your barangay</p>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Add New Resident</CardTitle>
          </CardHeader>
          <CardContent>
            <ResidentForm onSuccess={() => {
              setShowForm(false);
              refetch();
            }} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Residents Management</h1>
          <p className="text-muted-foreground">Manage and track all residents in your barangay</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search residents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Resident
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <ResidentsList residents={filteredResidents} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ResidentsPage;
