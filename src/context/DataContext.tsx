
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

interface Resident {
  id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  suffix?: string;
  gender: string;
  birthdate: string;
  civil_status: string;
  occupation?: string;
  address: string;
  purok: string;
  email?: string;
  mobile_number?: string;
  nationality: string;
  status: string;
  brgyid: string;
  household_id?: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

interface Household {
  id: string;
  name: string;
  address: string;
  purok: string;
  head_of_family?: string;
  headname?: string;
  status: string;
  brgyid: string;
  contact_number?: string;
  monthly_income?: string;
  year_established?: number;
  created_at: string;
  updated_at: string;
}

interface DataContextType {
  residents: Resident[];
  households: Household[];
  loading: boolean;
  refetchData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const { userProfile } = useAuth();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!userProfile?.brgyid) {
      return;
    }

    setLoading(true);
    
    try {
      // Fetch residents
      const { data: residentsData, error: residentsError } = await supabase
        .from('residents')
        .select('*')
        .eq('brgyid', userProfile.brgyid)
        .order('created_at', { ascending: false });

      if (residentsError) {
        console.error('Error fetching residents:', residentsError);
      } else {
        setResidents(residentsData || []);
      }

      // Fetch households
      const { data: householdsData, error: householdsError } = await supabase
        .from('households')
        .select('*')
        .eq('brgyid', userProfile.brgyid)
        .order('created_at', { ascending: false });

      if (householdsError) {
        console.error('Error fetching households:', householdsError);
      } else {
        setHouseholds(householdsData || []);
      }
    } catch (error) {
      console.error('Error in fetchData:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile?.brgyid) {
      fetchData();
    }
  }, [userProfile?.brgyid]);

  const value: DataContextType = {
    residents,
    households,
    loading,
    refetchData: fetchData,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
