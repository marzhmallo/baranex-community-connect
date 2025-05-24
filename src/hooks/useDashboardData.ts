
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardData {
  totalResidents: number;
  totalHouseholds: number;
  activeAnnouncements: number;
  upcomingEvents: number;
  monthlyResidents: Array<{ month: string; residents: number }>;
  genderDistribution: Array<{ age: string; male: number; female: number }>;
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

        // Fetch gender distribution by age groups
        const { data: residentsData, error: genderError } = await supabase
          .from('residents')
          .select('gender, birthdate');

        if (genderError) throw genderError;

        const genderDistribution = processGenderData(residentsData || []);

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

// Helper function to process gender distribution by age groups
const processGenderData = (data: Array<{ gender: string; birthdate: string }>) => {
  const ageGroups = [
    { age: '0-10', male: 0, female: 0 },
    { age: '11-20', male: 0, female: 0 },
    { age: '21-30', male: 0, female: 0 },
    { age: '31-40', male: 0, female: 0 },
    { age: '41-50', male: 0, female: 0 },
    { age: '51-60', male: 0, female: 0 },
    { age: '61-70', male: 0, female: 0 },
    { age: '71+', male: 0, female: 0 }
  ];

  data.forEach(resident => {
    const age = calculateAge(resident.birthdate);
    const gender = resident.gender?.toLowerCase();
    
    let ageGroupIndex = 0;
    if (age <= 10) ageGroupIndex = 0;
    else if (age <= 20) ageGroupIndex = 1;
    else if (age <= 30) ageGroupIndex = 2;
    else if (age <= 40) ageGroupIndex = 3;
    else if (age <= 50) ageGroupIndex = 4;
    else if (age <= 60) ageGroupIndex = 5;
    else if (age <= 70) ageGroupIndex = 6;
    else ageGroupIndex = 7;

    if (gender === 'male') {
      ageGroups[ageGroupIndex].male++;
    } else if (gender === 'female') {
      ageGroups[ageGroupIndex].female++;
    }
  });

  return ageGroups;
};

// Helper function to calculate age
const calculateAge = (birthdate: string): number => {
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};
