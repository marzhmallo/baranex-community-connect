
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import OfficialCard from '@/components/officials/OfficialCard';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

// Officials interface based on the required data structure
interface Official {
  id: string;
  name: string;
  position: string;
  email?: string;
  phone?: string;
  photo_url: string;
  bio?: string;
  address?: string;
  birthdate?: string;
  education?: string;
  achievements?: string[];
  committees?: string[];
  created_at: string;
  updated_at: string;
  term_start: string;
  term_end?: string;
  is_sk: boolean;
  brgyid: string;
}

const OfficialsPage = () => {
  const [activeTab, setActiveTab] = useState('current');

  // Fetch officials data from Supabase
  const { data: officials, isLoading, error } = useQuery({
    queryKey: ['officials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('officials')
        .select('*');
      
      if (error) throw error;
      return data as Official[];
    },
  });

  // Filter officials based on the active tab
  const filteredOfficials = officials ? officials.filter(official => {
    const now = new Date();
    
    if (activeTab === 'current') {
      return !official.term_end || new Date(official.term_end) > now;
    } else if (activeTab === 'sk') {
      return official.is_sk && (!official.term_end || new Date(official.term_end) > now);
    } else if (activeTab === 'previous') {
      return official.term_end && new Date(official.term_end) < now;
    }
    
    return false;
  }) : [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Barangay Officials</h1>
        <p className="text-muted-foreground">
          View and manage the elected and appointed officials of the barangay.
        </p>
      </div>

      <Tabs defaultValue="current" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="current">Current Officials</TabsTrigger>
          <TabsTrigger value="sk">SK Officials</TabsTrigger>
          <TabsTrigger value="previous">Previous Officials</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              // Show skeleton loaders while loading
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="w-full h-64" />
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))
            ) : error ? (
              <div className="col-span-4 p-6 text-red-500">
                Error loading officials: {error.message}
              </div>
            ) : filteredOfficials.length === 0 ? (
              <div className="col-span-4 p-6 text-center text-muted-foreground">
                No current officials found.
              </div>
            ) : (
              filteredOfficials.map(official => (
                <OfficialCard key={official.id} official={official} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="sk" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="w-full h-64" />
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))
            ) : error ? (
              <div className="col-span-4 p-6 text-red-500">
                Error loading SK officials: {error.message}
              </div>
            ) : filteredOfficials.length === 0 ? (
              <div className="col-span-4 p-6 text-center text-muted-foreground">
                No SK officials found.
              </div>
            ) : (
              filteredOfficials.map(official => (
                <OfficialCard key={official.id} official={official} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="previous" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="w-full h-64" />
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))
            ) : error ? (
              <div className="col-span-4 p-6 text-red-500">
                Error loading previous officials: {error.message}
              </div>
            ) : filteredOfficials.length === 0 ? (
              <div className="col-span-4 p-6 text-center text-muted-foreground">
                No previous officials found.
              </div>
            ) : (
              filteredOfficials.map(official => (
                <OfficialCard key={official.id} official={official} />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OfficialsPage;
