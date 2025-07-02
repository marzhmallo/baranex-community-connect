
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardData {
  totalResidents: number;
  totalHouseholds: number;
  activeAnnouncements: number;
  upcomingEvents: number;
  monthlyResidents: Array<{ month: string; residents: number }>;
  genderDistribution: Array<{ gender: string; count: number; percentage: number }>;
  residentGrowthRate: number;
  householdGrowthRate: number;
  newResidentsThisMonth: number;
  newHouseholdsThisMonth: number;
  newAnnouncementsThisWeek: number;
  nextEventDays: number | null;
  totalDeceased: number;
  totalRelocated: number;
}

interface DashboardDataContextType {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const DashboardDataContext = createContext<DashboardDataContextType | undefined>(undefined);

export const useDashboardDataContext = () => {
  const context = useContext(DashboardDataContext);
  if (context === undefined) {
    throw new Error('useDashboardDataContext must be used within a DashboardDataProvider');
  }
  return context;
};

export const DashboardDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setError(null);

      // Fetch total active residents (excluding deceased and relocated)
      const { count: residentsCount, error: residentsError } = await supabase
        .from('residents')
        .select('*', { count: 'exact', head: true })
        .not('status', 'in', '("Deceased","Relocated")');

      if (residentsError) throw residentsError;

      // Fetch deceased residents count
      const { count: deceasedCount, error: deceasedError } = await supabase
        .from('residents')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Deceased');

      if (deceasedError) throw deceasedError;

      // Fetch relocated residents count
      const { count: relocatedCount, error: relocatedError } = await supabase
        .from('residents')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Relocated');

      if (relocatedError) throw relocatedError;

      // Fetch total households
      const { count: householdsCount, error: householdsError } = await supabase
        .from('households')
        .select('*', { count: 'exact', head: true });

      if (householdsError) throw householdsError;

      // Fetch active announcements
      const { count: announcementsCount, error: announcementsError } = await supabase
        .from('announcements')
        .select('*', { count: 'exact', head: true });

      if (announcementsError) throw announcementsError;

      // Fetch upcoming events
      const { count: eventsCount, error: eventsError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gte('start_time', new Date().toISOString());

      if (eventsError) throw eventsError;

      // Calculate growth rates and monthly additions
      const now = new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const startOfThisWeek = new Date(now.setDate(now.getDate() - now.getDay()));

      // Fetch active residents added this month
      const { count: newResidentsThisMonth, error: newResidentsError } = await supabase
        .from('residents')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfThisMonth.toISOString())
        .not('status', 'in', '("Deceased","Relocated")');

      if (newResidentsError) throw newResidentsError;

      // Fetch active residents added last month
      const { count: newResidentsLastMonth, error: lastMonthResidentsError } = await supabase
        .from('residents')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfLastMonth.toISOString())
        .lt('created_at', startOfThisMonth.toISOString())
        .not('status', 'in', '("Deceased","Relocated")');

      if (lastMonthResidentsError) throw lastMonthResidentsError;

      // Fetch households added this month
      const { count: newHouseholdsThisMonth, error: newHouseholdsError } = await supabase
        .from('households')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfThisMonth.toISOString());

      if (newHouseholdsError) throw newHouseholdsError;

      // Fetch households added last month
      const { count: newHouseholdsLastMonth, error: lastMonthHouseholdsError } = await supabase
        .from('households')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfLastMonth.toISOString())
        .lt('created_at', startOfThisMonth.toISOString());

      if (lastMonthHouseholdsError) throw lastMonthHouseholdsError;

      // Fetch announcements added this week
      const { count: newAnnouncementsThisWeek, error: weekAnnouncementsError } = await supabase
        .from('announcements')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfThisWeek.toISOString());

      if (weekAnnouncementsError) throw weekAnnouncementsError;

      // Find next upcoming event
      const { data: nextEvent, error: nextEventError } = await supabase
        .from('events')
        .select('start_time')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(1)
        .single();

      let nextEventDays = null;
      if (!nextEventError && nextEvent) {
        const eventDate = new Date(nextEvent.start_time);
        const today = new Date();
        const diffTime = eventDate.getTime() - today.getTime();
        nextEventDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      // Calculate growth rates
      const residentGrowthRate = newResidentsLastMonth > 0 
        ? ((newResidentsThisMonth || 0) - (newResidentsLastMonth || 0)) / (newResidentsLastMonth || 1) * 100
        : newResidentsThisMonth > 0 ? 100 : 0;

      const householdGrowthRate = newHouseholdsLastMonth > 0 
        ? ((newHouseholdsThisMonth || 0) - (newHouseholdsLastMonth || 0)) / (newHouseholdsLastMonth || 1) * 100
        : newHouseholdsThisMonth > 0 ? 100 : 0;

      // Fetch monthly active residents data
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('residents')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
        .not('status', 'in', '("Deceased","Relocated")');

      if (monthlyError) throw monthlyError;

      // Process monthly data
      const monthlyResidents = processMonthlyData(monthlyData || []);

      // Fetch gender distribution from active residents
      const { data: genderData, error: genderError } = await supabase
        .from('residents')
        .select('gender')
        .not('status', 'in', '("Deceased","Relocated")');

      if (genderError) throw genderError;

      const genderDistribution = processGenderDistribution(genderData || [], residentsCount || 0);

      const dashboardData: DashboardData = {
        totalResidents: residentsCount || 0,
        totalHouseholds: householdsCount || 0,
        activeAnnouncements: announcementsCount || 0,
        upcomingEvents: eventsCount || 0,
        monthlyResidents,
        genderDistribution,
        residentGrowthRate,
        householdGrowthRate,
        newResidentsThisMonth: newResidentsThisMonth || 0,
        newHouseholdsThisMonth: newHouseholdsThisMonth || 0,
        newAnnouncementsThisWeek: newAnnouncementsThisWeek || 0,
        nextEventDays,
        totalDeceased: deceasedCount || 0,
        totalRelocated: relocatedCount || 0,
      };

      setData(dashboardData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    await fetchDashboardData();
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <DashboardDataContext.Provider value={{ data, isLoading, error, refreshData }}>
      {children}
    </DashboardDataContext.Provider>
  );
};

// Helper functions (same as before)
const processMonthlyData = (data: Array<{ created_at: string }>) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyCount: Record<string, number> = {};
  
  for (let i = 0; i <= currentMonth; i++) {
    monthlyCount[months[i]] = 0;
  }

  data.forEach(resident => {
    const date = new Date(resident.created_at);
    const residentYear = date.getFullYear();
    const residentMonth = date.getMonth();
    
    if (residentYear === currentYear && residentMonth <= currentMonth) {
      const monthName = months[residentMonth];
      if (monthlyCount.hasOwnProperty(monthName)) {
        monthlyCount[monthName]++;
      }
    }
  });

  let cumulative = 0;
  return months.slice(0, currentMonth + 1).map(month => {
    cumulative += monthlyCount[month];
    return {
      month,
      residents: cumulative
    };
  });
};

const processGenderDistribution = (data: Array<{ gender: string }>, totalResidents: number) => {
  const genderCount: Record<string, number> = {};
  
  data.forEach(resident => {
    let gender = resident.gender || 'Unknown';
    gender = gender.toLowerCase();
    if (gender === 'male' || gender === 'm') {
      gender = 'Male';
    } else if (gender === 'female' || gender === 'f') {
      gender = 'Female';
    } else if (gender === 'other' || gender === 'o') {
      gender = 'Other';
    } else {
      gender = 'Unknown';
    }
    genderCount[gender] = (genderCount[gender] || 0) + 1;
  });

  return Object.entries(genderCount).map(([gender, count]) => ({
    gender,
    count,
    percentage: totalResidents > 0 ? Math.round((count / totalResidents) * 100) : 0
  }));
};
