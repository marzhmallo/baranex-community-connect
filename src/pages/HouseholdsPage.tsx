
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Home, Plus, Search } from "lucide-react";
import HouseholdList from "@/components/households/HouseholdList";
import HouseholdForm from "@/components/households/HouseholdForm";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

const HouseholdsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { userProfile } = useAuth();

  const { data: households, isLoading, refetch } = useQuery({
    queryKey: ['households', userProfile?.brgyid],
    queryFn: async () => {
      if (!userProfile?.brgyid) return [];
      
      const { data, error } = await supabase
        .from('households')
        .select(`
          *,
          head_of_family:residents!households_head_of_family_fkey(*)
        `)
        .eq('brgyid', userProfile.brgyid)
        .order('household_number', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userProfile?.brgyid
  });

  const filteredHouseholds = households?.filter(household =>
    household.household_number?.toString().includes(searchTerm) ||
    household.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${household.head_of_family?.first_name || ''} ${household.head_of_family?.last_name || ''}`
      .toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (showForm) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Home className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold">Households Management</h1>
            <p className="text-muted-foreground">Manage household records and family units in your barangay</p>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Add New Household</CardTitle>
          </CardHeader>
          <CardContent>
            <HouseholdForm onSuccess={() => {
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
        <Home className="h-8 w-8 text-green-600" />
        <div>
          <h1 className="text-3xl font-bold">Households Management</h1>
          <p className="text-muted-foreground">Manage household records and family units in your barangay</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search households..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Household
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <HouseholdList households={filteredHouseholds} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
};

export default HouseholdsPage;
