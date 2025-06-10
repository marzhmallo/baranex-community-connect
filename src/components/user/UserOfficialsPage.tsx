
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Award, Calendar, MapPin, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import OfficialCard from '@/components/officials/OfficialCard';
import { Official } from '@/lib/types';
import moment from 'moment';

const UserOfficialsPage = () => {
  const { userProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('current');

  const { data: officials, isLoading } = useQuery({
    queryKey: ['user-officials', userProfile?.brgyid],
    queryFn: async (): Promise<Official[]> => {
      if (!userProfile?.brgyid) {
        return [];
      }

      try {
        // Get officials with their positions
        const { data: officials, error } = await supabase
          .from('officials')
          .select(`
            *,
            officialPositions:official_positions(*)
          `)
          .eq('brgyid', userProfile.brgyid);

        if (error) {
          console.error('Error fetching officials:', error);
          throw error;
        }

        return officials || [];
      } catch (error) {
        console.error('Error in officials query:', error);
        throw error;
      }
    },
    enabled: !!userProfile?.brgyid
  });

  // Filter officials based on search query
  const filteredOfficials = officials?.filter(official => 
    official.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    official.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    official.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Filter officials by tab (current, SK, previous)
  const getCurrentOfficials = () => {
    return filteredOfficials.filter(official => {
      if (official.officialPositions && official.officialPositions.length > 0) {
        return official.officialPositions.some(pos => 
          !pos.term_end || new Date(pos.term_end) >= new Date()
        );
      }
      return !official.term_end || new Date(official.term_end) >= new Date();
    });
  };

  const getSKOfficials = () => {
    return filteredOfficials.filter(official => {
      const isSK = Array.isArray(official.is_sk) ? official.is_sk.includes(true) : official.is_sk;
      if (official.officialPositions && official.officialPositions.length > 0) {
        const hasCurrentTerm = official.officialPositions.some(pos => 
          !pos.term_end || new Date(pos.term_end) >= new Date()
        );
        return isSK && hasCurrentTerm;
      }
      const hasCurrentTerm = !official.term_end || new Date(official.term_end) >= new Date();
      return isSK && hasCurrentTerm;
    });
  };

  const getPreviousOfficials = () => {
    return filteredOfficials.filter(official => {
      if (official.officialPositions && official.officialPositions.length > 0) {
        return official.officialPositions.every(pos => 
          pos.term_end && new Date(pos.term_end) < new Date()
        );
      }
      return official.term_end && new Date(official.term_end) < new Date();
    });
  };

  const getOfficialsForTab = () => {
    switch (activeTab) {
      case 'current':
        return getCurrentOfficials();
      case 'sk':
        return getSKOfficials();
      case 'previous':
        return getPreviousOfficials();
      default:
        return getCurrentOfficials();
    }
  };

  const officialsToShow = getOfficialsForTab();

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Award className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Barangay Officials</h1>
          <p className="text-muted-foreground">Meet your local government representatives</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start justify-between mb-6">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search officials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Tabs defaultValue="current" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="current">Current Officials</TabsTrigger>
          <TabsTrigger value="sk">SK Officials</TabsTrigger>
          <TabsTrigger value="previous">Previous Officials</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {officialsToShow.map((official) => (
              <OfficialCard key={official.id} official={official} />
            ))}
            
            {officialsToShow.length === 0 && (
              <div className="col-span-full">
                <Card>
                  <CardContent className="text-center py-12">
                    <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {searchQuery 
                        ? "No officials found matching your search."
                        : "No current officials information available at this time."
                      }
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="sk" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {officialsToShow.map((official) => (
              <OfficialCard key={official.id} official={official} />
            ))}
            
            {officialsToShow.length === 0 && (
              <div className="col-span-full">
                <Card>
                  <CardContent className="text-center py-12">
                    <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {searchQuery 
                        ? "No SK officials found matching your search."
                        : "No SK officials information available at this time."
                      }
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="previous" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {officialsToShow.map((official) => (
              <OfficialCard key={official.id} official={official} />
            ))}
            
            {officialsToShow.length === 0 && (
              <div className="col-span-full">
                <Card>
                  <CardContent className="text-center py-12">
                    <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {searchQuery 
                        ? "No previous officials found matching your search."
                        : "No previous officials information available at this time."
                      }
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserOfficialsPage;
