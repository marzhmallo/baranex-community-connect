import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import OfficialCard from '@/components/officials/OfficialCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RefreshCw, Plus, ArrowLeft, LayoutGrid, Users } from 'lucide-react';
import { Official, OfficialPosition } from '@/lib/types';
import { AddOfficialDialog } from '@/components/officials/AddOfficialDialog';
import { OrganizationalChart } from '@/components/officials/OrganizationalChart';

const OfficialsPage = () => {
  const [activeTab, setActiveTab] = useState('current');
  const [activeSKTab, setActiveSKTab] = useState('current');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'organizational'>('cards');

  // Fetch officials data from Supabase with positions
  const {
    data: officialsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['officials-with-positions'],
    queryFn: async () => {
      // First, fetch all officials
      const {
        data: officials,
        error: officialsError
      } = await supabase.from('officials').select('*');
      if (officialsError) throw officialsError;

      // Then fetch all positions
      const {
        data: positions,
        error: positionsError
      } = await supabase.from('official_positions').select('*').order('term_start', {
        ascending: false
      });
      if (positionsError) throw positionsError;

      // Group positions by official
      const officialsWithPositions: Official[] = officials.map(official => {
        // Get all positions for this official
        const officialPositions = positions.filter(position => position.official_id === official.id);

        // Use the most recent position (latest term_start date)
        let latestPosition = officialPositions.length > 0 ? officialPositions[0] : null;
        if (officialPositions.length > 1) {
          latestPosition = officialPositions.reduce((latest, current) => {
            // If either position has no term_end, compare carefully
            if (!latest.term_end) return latest; // Latest has no end date, keep it
            if (!current.term_end) return current; // Current has no end date, it's ongoing

            // Otherwise compare end dates
            return new Date(current.term_end) > new Date(latest.term_end) ? current : latest;
          }, officialPositions[0]);
        }
        return {
          ...official,
          // Handle boolean conversion for is_sk field
          is_sk: Array.isArray(official.is_sk) ? official.is_sk.length > 0 && official.is_sk[0] === true : Boolean(official.is_sk),
          // Update with position data if we have it
          position: latestPosition?.position || '',
          term_start: latestPosition?.term_start || official.term_start,
          term_end: latestPosition?.term_end || official.term_end,
          // Store the positions for potential use in components
          officialPositions: officialPositions
        };
      });
      return officialsWithPositions;
    }
  });

  // Filter officials based on the active tab
  const filteredOfficials = officialsData ? officialsData.filter(official => {
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
  }) : [];

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

  const handleRefreshTerms = () => {
    refetch();
  };

  const handleAddSuccess = () => {
    refetch();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header with title, subtitle, and action buttons */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1 mx-0">
            <Button variant="ghost" className="p-0 hover:bg-transparent">
              
            </Button>
            <h1 className="text-3xl font-bold text-foreground mx-0">Barangay Officials</h1>
          </div>
          <p className="text-muted-foreground mx-[10px]">Meet the elected officials serving our barangay</p>
        </div>
        <div className="flex gap-3">
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="flex items-center gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              Cards
            </Button>
            <Button
              variant={viewMode === 'organizational' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('organizational')}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Organization
            </Button>
          </div>
          <Button variant="outline" className="border-border text-foreground hover:bg-accent" onClick={handleRefreshTerms}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh Terms
          </Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Official
          </Button>
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

      {/* Content based on view mode */}
      {viewMode === 'organizational' ? (
        <OrganizationalChart officials={filteredOfficials} isLoading={isLoading} error={error} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ?
            // Show skeleton loaders while loading
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card rounded-lg overflow-hidden border">
                <Skeleton className="w-full h-64 bg-muted" />
                <div className="p-5">
                  <Skeleton className="h-6 w-3/4 mb-2 bg-muted" />
                  <Skeleton className="h-4 w-1/2 mb-4 bg-muted" />
                  <Skeleton className="h-16 w-full mb-4 bg-muted" />
                  <Skeleton className="h-4 w-full mb-2 bg-muted" />
                  <Skeleton className="h-4 w-full mb-4 bg-muted" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-1/3 bg-muted" />
                    <Skeleton className="h-8 w-20 bg-muted" />
                  </div>
                </div>
              </div>
            )) : error ? (
              <div className="col-span-full p-6 text-destructive bg-card rounded-lg border">
                Error loading officials: {error.message}
              </div>
            ) : filteredOfficials.length === 0 ? (
              <div className="col-span-full p-6 text-center text-muted-foreground bg-card rounded-lg border mx-[240px]">
                No {activeTab === 'current' ? 'current' : activeTab === 'sk' ? activeSKTab === 'current' ? 'current SK' : 'previous SK' : 'previous'} officials found.
              </div>
            ) : filteredOfficials.map(official => (
              <OfficialCard key={official.id} official={official} />
            ))
          }
        </div>
      )}

      {/* Add Official Dialog */}
      <AddOfficialDialog open={showAddDialog} onOpenChange={setShowAddDialog} onSuccess={handleAddSuccess} />
    </div>
  );
};

export default OfficialsPage;
