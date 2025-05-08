import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import OfficialCard from '@/components/officials/OfficialCard';
import { Button } from '@/components/ui/button';
import { RefreshCw, Plus, ArrowLeft } from 'lucide-react';

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
  achievements?: string[] | null;
  committees?: string[] | null | any; // Make flexible to handle JSON
  created_at: string;
  updated_at: string;
  term_start: string;
  term_end?: string;
  is_sk: boolean | boolean[]; // Handle both potential types
  brgyid: string;
}
const OfficialsPage = () => {
  const [activeTab, setActiveTab] = useState('current');

  // Fetch officials data from Supabase
  const {
    data: officialsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['officials'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('officials').select('*');
      if (error) throw error;

      // Transform the data to match our Official interface
      const transformedData: Official[] = data.map(official => ({
        ...official,
        // Ensure is_sk is a boolean
        is_sk: Array.isArray(official.is_sk) ? official.is_sk.length > 0 && official.is_sk[0] === true : Boolean(official.is_sk)
      }));
      return transformedData;
    }
  });

  // Filter officials based on the active tab
  const filteredOfficials = officialsData ? officialsData.filter(official => {
    const now = new Date();
    const isSk = Array.isArray(official.is_sk) ? official.is_sk.length > 0 && official.is_sk[0] === true : Boolean(official.is_sk);
    if (activeTab === 'current') {
      return !official.term_end || new Date(official.term_end) > now;
    } else if (activeTab === 'sk') {
      return isSk && (!official.term_end || new Date(official.term_end) > now);
    } else if (activeTab === 'previous') {
      return official.term_end && new Date(official.term_end) < now;
    }
    return false;
  }) : [];

  // Count for each category
  const currentCount = officialsData ? officialsData.filter(o => !o.term_end || new Date(o.term_end) > new Date()).length : 0;
  const skCount = officialsData ? officialsData.filter(o => {
    const isSk = Array.isArray(o.is_sk) ? o.is_sk.length > 0 && o.is_sk[0] === true : Boolean(o.is_sk);
    return isSk && (!o.term_end || new Date(o.term_end) > new Date());
  }).length : 0;
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

      {/* Tabbed navigation */}
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

      {/* Officials cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ?
      // Show skeleton loaders while loading
      Array.from({
        length: 4
      }).map((_, i) => <div key={i} className="bg-[#1e2637] rounded-lg overflow-hidden">
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
            </div>) : error ? <div className="col-span-full p-6 text-red-500 bg-[#1e2637] rounded-lg">
            Error loading officials: {error.message}
          </div> : filteredOfficials.length === 0 ? <div className="col-span-full p-6 text-center text-gray-400 bg-[#1e2637] rounded-lg">
            No {activeTab === 'current' ? 'current' : activeTab === 'sk' ? 'SK' : 'previous'} officials found.
          </div> : filteredOfficials.map(official => <OfficialCard key={official.id} official={official} />)}
      </div>
    </div>;
};
export default OfficialsPage;