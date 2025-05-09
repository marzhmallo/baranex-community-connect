
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import OfficialCard from '@/components/officials/OfficialCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RefreshCw, Plus, ArrowLeft } from 'lucide-react';
import { Official, OfficialPosition } from '@/lib/types';

const OfficialsPage = () => {
  const [activeTab, setActiveTab] = useState('current');
  const [activeSKTab, setActiveSKTab] = useState('current');

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
      const { data: officials, error: officialsError } = await supabase
        .from('officials')
        .select('*');
      
      if (officialsError) throw officialsError;
      
      // Then fetch all positions
      const { data: positions, error: positionsError } = await supabase
        .from('official_positions')
        .select('*')
        .order('term_start', { ascending: false });
        
      if (positionsError) throw positionsError;

      // Group positions by official
      const officialsWithPositions: Official[] = officials.map(official => {
        const officialPositions = positions.filter(
          position => position.official_id === official.id
        );
        
        // Use the most recent position (latest term_end date)
        let latestPosition = officialPositions[0];
        if (officialPositions.length > 1) {
          latestPosition = officialPositions.reduce((latest, current) => {
            if (!latest.term_end) return current;
            if (!current.term_end) return latest;
            return new Date(current.term_end) > new Date(latest.term_end) ? current : latest;
          }, officialPositions[0]);
        }
        
        return {
          ...official,
          // Handle boolean conversion for is_sk field
          is_sk: Array.isArray(official.is_sk) ? 
            official.is_sk.length > 0 && official.is_sk[0] === true : 
            Boolean(official.is_sk),
          // Update with position data if we have it
          position: latestPosition?.position || official.position,
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
    const isSk = Array.isArray(official.is_sk) ? 
      official.is_sk.length > 0 && official.is_sk[0] === true : 
      Boolean(official.is_sk);
      
    if (activeTab === 'current') {
      return !official.term_end || new Date(official.term_end) > now;
    } else if (activeTab === 'sk') {
      if (activeSKTab === 'current') {
        return isSk && (!official.term_end || new Date(official.term_end) > now);
      } else if (activeSKTab === 'previous') {
        return isSk && official.term_end && new Date(official.term_end) < now;
      }
      return isSk;
    } else if (activeTab === 'previous') {
      return official.term_end && new Date(official.term_end) < now;
    }
    return false;
  }) : [];

  // Count for each category
  const currentCount = officialsData ? officialsData.filter(o => !o.term_end || new Date(o.term_end) > new Date()).length : 0;
  
  const skCurrentCount = officialsData ? officialsData.filter(o => {
    const isSk = Array.isArray(o.is_sk) ? o.is_sk.length > 0 && o.is_sk[0] === true : Boolean(o.is_sk);
    return isSk && (!o.term_end || new Date(o.term_end) > new Date());
  }).length : 0;
  
  const skPreviousCount = officialsData ? officialsData.filter(o => {
    const isSk = Array.isArray(o.is_sk) ? o.is_sk.length > 0 && o.is_sk[0] === true : Boolean(o.is_sk);
    return isSk && o.term_end && new Date(o.term_end) < new Date();
  }).length : 0;
  
  const skCount = skCurrentCount + skPreviousCount;
  const previousCount = officialsData ? officialsData.filter(o => o.term_end && new Date(o.term_end) < new Date()).length : 0;
  
  const handleRefreshTerms = () => {
    refetch();
  };

  return <div className="min-h-screen bg-[#0f172a] p-6">
      {/* Header with title, subtitle, and action buttons */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1 mx-0">
            <Button variant="ghost" className="p-0 hover:bg-transparent">
              
            </Button>
            <h1 className="text-3xl font-bold text-white mx-0">Barangay Officials</h1>
          </div>
          <p className="text-gray-400 mx-[10px]">Meet the elected officials serving our barangay</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800" onClick={handleRefreshTerms}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh Terms
          </Button>
          <Button className="bg-blue-500 hover:bg-blue-600">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main tabbed navigation */}
      <div className="mx-auto max-w-3xl mb-8 bg-[#1e2637] rounded-full p-1">
        <div className="flex justify-center">
          <div className={`flex-1 max-w-[33%] text-center py-2 px-4 rounded-full cursor-pointer transition-all ${activeTab === 'current' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'}`} onClick={() => setActiveTab('current')}>
            Current Officials ({currentCount})
          </div>
          <div className={`flex-1 max-w-[33%] text-center py-2 px-4 rounded-full cursor-pointer transition-all ${activeTab === 'sk' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'}`} onClick={() => setActiveTab('sk')}>
            SK Officials ({skCount})
          </div>
          <div className={`flex-1 max-w-[33%] text-center py-2 px-4 rounded-full cursor-pointer transition-all ${activeTab === 'previous' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'}`} onClick={() => setActiveTab('previous')}>
            Previous Officials ({previousCount})
          </div>
        </div>
      </div>

      {/* SK Tab sub-navigation */}
      {activeTab === 'sk' && (
        <div className="mx-auto max-w-xl mb-8 bg-[#1e2637] rounded-full p-1">
          <div className="flex justify-center">
            <div 
              className={`flex-1 max-w-[50%] text-center py-2 px-4 rounded-full cursor-pointer transition-all ${activeSKTab === 'current' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-gray-200'}`} 
              onClick={() => setActiveSKTab('current')}
            >
              Current SK ({skCurrentCount})
            </div>
            <div 
              className={`flex-1 max-w-[50%] text-center py-2 px-4 rounded-full cursor-pointer transition-all ${activeSKTab === 'previous' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-gray-200'}`} 
              onClick={() => setActiveSKTab('previous')}
            >
              Previous SK ({skPreviousCount})
            </div>
          </div>
        </div>
      )}

      {/* Officials cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ?
          // Show skeleton loaders while loading
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#1e2637] rounded-lg overflow-hidden">
              <Skeleton className="w-full h-64 bg-[#2a3649]" />
              <div className="p-5">
                <Skeleton className="h-6 w-3/4 mb-2 bg-[#2a3649]" />
                <Skeleton className="h-4 w-1/2 mb-4 bg-[#2a3649]" />
                <Skeleton className="h-16 w-full mb-4 bg-[#2a3649]" />
                <Skeleton className="h-4 w-full mb-2 bg-[#2a3649]" />
                <Skeleton className="h-4 w-full mb-4 bg-[#2a3649]" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-1/3 bg-[#2a3649]" />
                  <Skeleton className="h-8 w-20 bg-[#2a3649]" />
                </div>
              </div>
            </div>
          )) 
        : error ? 
          <div className="col-span-full p-6 text-red-500 bg-[#1e2637] rounded-lg">
            Error loading officials: {error.message}
          </div> 
        : filteredOfficials.length === 0 ? 
          <div className="col-span-full p-6 text-center text-gray-400 bg-[#1e2637] rounded-lg">
            No {activeTab === 'current' ? 'current' : activeTab === 'sk' ? (activeSKTab === 'current' ? 'current SK' : 'previous SK') : 'previous'} officials found.
          </div> 
        : filteredOfficials.map(official => 
          <OfficialCard key={official.id} official={official} />
        )}
      </div>
    </div>;
};

export default OfficialsPage;
