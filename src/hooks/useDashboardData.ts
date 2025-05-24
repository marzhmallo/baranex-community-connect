
import { useState, useEffect } from 'react';
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
  isLoading: boolean;
  error: string | null;
}

export const useDashboardData = () => {
  const [data, setData] = useState<DashboardData>({
    totalResidents: 0,
    totalHouseholds: 0,
    activeAnnouncements: 0,
    upcomingEvents: 0,
    monthlyResidents: [],
    genderDistribution: [],
    residentGrowthRate: 0,
    householdGrowthRate: 0,
    newResidentsThisMonth: 0,
    newHouseholdsThisMonth: 0,
    newAnnouncementsThisWeek: 0,
    nextEventDays: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch total residents
        const { count: residentsCount, error: residentsError } = await supabase
          .from('residents')
          .select('*', { count: 'exact', head: true });

        if (residentsError) throw residentsError;

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

        // Fetch residents added this month
        const { count: newResidentsThisMonth, error: newResidentsError } = await supabase
          .from('residents')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfThisMonth.toISOString());

        if (newResidentsError) throw newResidentsError;

        // Fetch residents added last month
        const { count: newResidentsLastMonth, error: lastMonthResidentsError } = await supabase
          .from('residents')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfLastMonth.toISOString())
          .lt('created_at', startOfThisMonth.toISOString());

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

        // Fetch monthly residents data (last 12 months)
        const { data: monthlyData, error: monthlyError } = await supabase
          .from('residents')
          .select('created_at')
          .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());

        if (monthlyError) throw monthlyError;

        // Process monthly data
        const monthlyResidents = processMonthlyData(monthlyData || []);

        // Fetch gender distribution from residents table
        const { data: genderData, error: genderError } = await supabase
          .from('residents')
          .select('gender');

        if (genderError) throw genderError;

        const genderDistribution = processGenderDistribution(genderData || [], residentsCount || 0);

        setData({
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
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'An error occurred',
        }));
      }
    };

    fetchDashboardData();
  }, []);

  return data;
};

// Helper function to process monthly data
const processMonthlyData = (data: Array<{ created_at: string }>) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyCount: Record<string, number> = {};
  
  // Initialize all months to 0
  months.forEach(month => {
    monthlyCount[month] = 0;
  });

  // Count residents by month
  data.forEach(resident => {
    const date = new Date(resident.created_at);
    const monthName = months[date.getMonth()];
    monthlyCount[monthName]++;
  });

  // Convert to array format and calculate cumulative
  let cumulative = 0;
  return months.map(month => {
    cumulative += monthlyCount[month];
    return {
      month,
      residents: cumulative
    };
  });
};

// Helper function to process gender distribution
const processGenderDistribution = (data: Array<{ gender: string }>, totalResidents: number) => {
  const genderCount: Record<string, number> = {};
  
  // Count each gender
  data.forEach(resident => {
    const gender = resident.gender || 'Unknown';
    genderCount[gender] = (genderCount[gender] || 0) + 1;
  });

  // Convert to array format with percentages
  return Object.entries(genderCount).map(([gender, count]) => ({
    gender: gender.charAt(0).toUpperCase() + gender.slice(1),
    count,
    percentage: totalResidents > 0 ? Math.round((count / totalResidents) * 100) : 0
  }));
};
