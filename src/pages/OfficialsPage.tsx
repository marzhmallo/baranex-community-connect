
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Plus, Users, BarChart3 } from 'lucide-react';
import OfficialCard from '@/components/officials/OfficialCard';
import AddOfficialDialog from '@/components/officials/AddOfficialDialog';
import OrganizationalChart from '@/components/officials/OrganizationalChart';
import RankManagementDialog from '@/components/officials/RankManagementDialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const OfficialsPage = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRankDialog, setShowRankDialog] = useState(false);
  const { userProfile } = useAuth();

  const { data: officials, isLoading, refetch } = useQuery({
    queryKey: ['officials', userProfile?.brgyid],
    queryFn: async () => {
      if (!userProfile?.brgyid) return [];
      
      const { data, error } = await supabase
        .from('officials')
        .select(`
          *,
          position:positions(*)
        `)
        .eq('brgyid', userProfile.brgyid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userProfile?.brgyid
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Award className="h-8 w-8 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold">Officials Management</h1>
          <p className="text-muted-foreground">Manage barangay officials, positions, and organizational structure</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Official
          </Button>
          <Button variant="outline" onClick={() => setShowRankDialog(true)} className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Manage Positions
          </Button>
        </div>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Officials List
          </TabsTrigger>
          <TabsTrigger value="chart" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Organizational Chart
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : officials && officials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {officials.map((official) => (
                <OfficialCard key={official.id} official={official} onUpdate={refetch} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No officials found. Add your first official to get started.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="chart" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Organizational Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <OrganizationalChart officials={officials || []} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddOfficialDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
        onSuccess={refetch}
      />
      
      <RankManagementDialog 
        open={showRankDialog} 
        onOpenChange={setShowRankDialog}
      />
    </div>
  );
};

export default OfficialsPage;
