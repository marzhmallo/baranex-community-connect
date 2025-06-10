
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
import { Official } from '@/lib/types';
import { useNavigate } from 'react-router-dom';

const UserOfficialsPage = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('current');
  const [activeSKTab, setActiveSKTab] = useState('current');

  const { data: officialsData, isLoading } = useQuery({
    queryKey: ['user-officials-with-positions', userProfile?.brgyid],
    queryFn: async (): Promise<Official[]> => {
      if (!userProfile?.brgyid) {
        return [];
      }

      try {
        // First, fetch all officials
        const { data: officials, error: officialsError } = await supabase
          .from('officials')
          .select('*')
          .eq('brgyid', userProfile.brgyid);
        
        if (officialsError) throw officialsError;

        // Then fetch all positions
        const { data: positions, error: positionsError } = await supabase
          .from('official_positions')
          .select('*')
          .order('term_start', { ascending: false });
        
        if (positionsError) throw positionsError;

        // Group positions by official
        const officialsWithPositions: Official[] = officials.map(official => {
          // Get all positions for this official
          const officialPositions = positions.filter(position => position.official_id === official.id);

          // Use the most recent position (latest term_start date)
          let latestPosition = officialPositions.length > 0 ? officialPositions[0] : null;
          if (officialPositions.length > 1) {
            latestPosition = officialPositions.reduce((latest, current) => {
              if (!latest.term_end) return latest;
              if (!current.term_end) return current;
              return new Date(current.term_end) > new Date(latest.term_end) ? current : latest;
            }, officialPositions[0]);
          }

          return {
            ...official,
            is_sk: Array.isArray(official.is_sk) ? official.is_sk.length > 0 && official.is_sk[0] === true : Boolean(official.is_sk),
            position: latestPosition?.position || official.position || '',
            term_start: latestPosition?.term_start || official.term_start,
            term_end: latestPosition?.term_end || official.term_end,
            officialPositions: officialPositions
          };
        });

        return officialsWithPositions;
      } catch (error) {
        console.error('Error in officials query:', error);
        throw error;
      }
    },
    enabled: !!userProfile?.brgyid
  });

  // Filter officials based on search query
  const filteredOfficials = officialsData?.filter(official => 
    official.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    official.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    official.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Filter officials based on the active tab
  const getFilteredOfficials = () => {
    return filteredOfficials.filter(official => {
      const now = new Date();
      const isSk = Array.isArray(official.is_sk) ? official.is_sk.length > 0 && official.is_sk[0] === true : Boolean(official.is_sk);
      
      if (activeTab === 'current') {
        // Exclude SK officials from the current tab
        return !isSk && (!official.term_end || new Date(official.term_end) > now);
      } else if (activeTab === 'sk') {
        if (activeSKTab === 'current') {
          return isSk && (!official.term_end || new Date(official.term_end) > now);
        } else if (activeSKTab === 'previous') {
          return isSk && official.term_end && new Date(official.term_end) < now;
        }
        return isSk;
      } else if (activeTab === 'previous') {
        // Exclude SK officials from the previous tab
        return !isSk && official.term_end && new Date(official.term_end) < now;
      }
      return false;
    });
  };

  const filteredOfficialsToShow = getFilteredOfficials();

  // Count for each category (excluding SK from current/previous)
  const currentCount = officialsData ? officialsData.filter(o => {
    const isSk = Array.isArray(o.is_sk) ? o.is_sk.length > 0 && o.is_sk[0] === true : Boolean(o.is_sk);
    return !isSk && (!o.term_end || new Date(o.term_end) > new Date());
  }).length : 0;

  const skCurrentCount = officialsData ? officialsData.filter(o => {
    const isSk = Array.isArray(o.is_sk) ? o.is_sk.length > 0 && o.is_sk[0] === true : Boolean(o.is_sk);
    return isSk && (!o.term_end || new Date(o.term_end) > new Date());
  }).length : 0;

  const skPreviousCount = officialsData ? officialsData.filter(o => {
    const isSk = Array.isArray(o.is_sk) ? o.is_sk.length > 0 && o.is_sk[0] === true : Boolean(o.is_sk);
    return isSk && o.term_end && new Date(o.term_end) < new Date();
  }).length : 0;

  const skCount = skCurrentCount + skPreviousCount;

  const previousCount = officialsData ? officialsData.filter(o => {
    const isSk = Array.isArray(o.is_sk) ? o.is_sk.length > 0 && o.is_sk[0] === true : Boolean(o.is_sk);
    return !isSk && o.term_end && new Date(o.term_end) < new Date();
  }).length : 0;

  const handleOfficialClick = (officialId: string) => {
    navigate(`/hub/officials/${officialId}`);
  };

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

      {/* Main tabbed navigation */}
      <div className="mx-auto max-w-3xl mb-8 bg-card rounded-full p-1 border">
        <div className="flex justify-center">
          <div className={`flex-1 max-w-[33%] text-center py-2 px-4 rounded-full cursor-pointer transition-all ${activeTab === 'current' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => setActiveTab('current')}>
            Current Officials ({currentCount})
          </div>
          <div className={`flex-1 max-w-[33%] text-center py-2 px-4 rounded-full cursor-pointer transition-all ${activeTab === 'sk' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => setActiveTab('sk')}>
            SK Officials ({skCount})
          </div>
          <div className={`flex-1 max-w-[33%] text-center py-2 px-4 rounded-full cursor-pointer transition-all ${activeTab === 'previous' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => setActiveTab('previous')}>
            Previous Officials ({previousCount})
          </div>
        </div>
      </div>

      {/* SK Tab sub-navigation */}
      {activeTab === 'sk' && (
        <div className="mx-auto max-w-xl mb-8 bg-card rounded-full p-1 border">
          <div className="flex justify-center">
            <div className={`flex-1 max-w-[50%] text-center py-2 px-4 rounded-full cursor-pointer transition-all ${activeSKTab === 'current' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => setActiveSKTab('current')}>
              Current SK ({skCurrentCount})
            </div>
            <div className={`flex-1 max-w-[50%] text-center py-2 px-4 rounded-full cursor-pointer transition-all ${activeSKTab === 'previous' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => setActiveSKTab('previous')}>
              Previous SK ({skPreviousCount})
            </div>
          </div>
        </div>
      )}

      {/* Officials cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredOfficialsToShow.length === 0 ? (
          <div className="col-span-full p-6 text-center text-muted-foreground bg-card rounded-lg border mx-[240px]">
            No {activeTab === 'current' ? 'current' : activeTab === 'sk' ? activeSKTab === 'current' ? 'current SK' : 'previous SK' : 'previous'} officials found.
          </div>
        ) : (
          filteredOfficialsToShow.map(official => (
            <Card 
              key={official.id} 
              className="bg-card rounded-lg overflow-hidden border cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleOfficialClick(official.id)}
            >
              <div className="relative">
                <div className="w-full h-64 overflow-hidden">
                  {official.photo_url ? (
                    <img
                      src={official.photo_url}
                      alt={official.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Avatar className="h-20 w-20">
                        <AvatarFallback className="text-2xl">
                          {official.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                </div>
                
                {official.is_sk && (
                  <Badge className="absolute top-2 right-2 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                    SK
                  </Badge>
                )}
              </div>
              
              <CardContent className="p-5">
                <div className="text-center mb-4">
                  <h3 className="font-bold text-lg text-foreground mb-1">{official.name}</h3>
                  <p className="text-primary font-medium">{official.position}</p>
                </div>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  {official.email && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{official.email}</span>
                    </div>
                  )}
                  
                  {(official.term_start || official.term_end) && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>
                        {official.term_start ? new Date(official.term_start).getFullYear() : 'N/A'} - 
                        {official.term_end ? new Date(official.term_end).getFullYear() : 'Present'}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default UserOfficialsPage;
