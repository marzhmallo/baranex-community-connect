import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

// Dashboard data types
interface DashboardStats {
  totalResidents: number;
  totalHouseholds: number;
  activeAnnouncements: number;
  upcomingEvents: number;
  newResidentsThisMonth: number;
  newHouseholdsThisMonth: number;
  newAnnouncementsThisWeek: number;
  nextEventDays: number | null;
  totalDeceased: number;
  totalRelocated: number;
  residentGrowthRate: number;
  householdGrowthRate: number;
}

interface DashboardCharts {
  monthlyResidents: Array<{ month: string; residents: number }>;
  genderDistribution: Array<{ gender: string; count: number; percentage: number }>;
}

interface UserProfile {
  id: string;
  email: string;
  username?: string;
  role: string;
  brgyid?: string;
  first_name?: string;
  last_name?: string;
  [key: string]: any;
}

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

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  created_by: string;
  is_pinned?: boolean;
  photo_url?: string;
}

interface Event {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  location: string;
  event_type: string;
  target_audience: string;
  description?: string;
}

interface OfficialWithPosition {
  id: string;
  name: string;
  photo_url: string;
  position: string;
  term_start: string;
  term_end: string;
}

interface DashboardData {
  profile: UserProfile | null;
  barangayName: string;
  stats: DashboardStats | null;
  charts: DashboardCharts | null;
  residents: Resident[];
  households: Household[];
  announcements: Announcement[];
  events: Event[];
  officials: OfficialWithPosition[];
  isPreloaded: boolean;
}

interface DashboardStore {
  data: DashboardData;
  setDashboardData: (data: Partial<DashboardData>) => void;
  clearDashboardData: () => void;
  prefetchDashboardData: (userProfile: UserProfile) => Promise<void>;
}

const initialDashboardData: DashboardData = {
  profile: null,
  barangayName: '',
  stats: null,
  charts: null,
  residents: [],
  households: [],
  announcements: [],
  events: [],
  officials: [],
  isPreloaded: false,
};

// Helper function to process monthly data
const processMonthlyData = (data: Array<{ created_at: string }>) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyCount: Record<string, number> = {};
  
  // Initialize months up to current month only
  for (let i = 0; i <= currentMonth; i++) {
    monthlyCount[months[i]] = 0;
  }

  // Count residents by month (only up to current month)
  data.forEach(resident => {
    const date = new Date(resident.created_at);
    const residentYear = date.getFullYear();
    const residentMonth = date.getMonth();
    
    // Only include data from current year and up to current month
    if (residentYear === currentYear && residentMonth <= currentMonth) {
      const monthName = months[residentMonth];
      if (monthlyCount.hasOwnProperty(monthName)) {
        monthlyCount[monthName]++;
      }
    }
  });

  // Convert to array format and calculate cumulative (only up to current month)
  let cumulative = 0;
  return months.slice(0, currentMonth + 1).map(month => {
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
    let gender = resident.gender || 'Unknown';
    // Normalize gender values
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

  // Convert to array format with percentages
  return Object.entries(genderCount).map(([gender, count]) => ({
    gender,
    count,
    percentage: totalResidents > 0 ? Math.round((count / totalResidents) * 100) : 0
  }));
};

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  data: initialDashboardData,
  
  setDashboardData: (newData) =>
    set((state) => ({
      data: { ...state.data, ...newData }
    })),
  
  clearDashboardData: () =>
    set({ data: initialDashboardData }),
  
  prefetchDashboardData: async (userProfile: UserProfile) => {
    try {
      console.log('Pre-fetching dashboard data for user:', userProfile.id);
      
      if (!userProfile.brgyid) {
        throw new Error('User profile missing brgyid');
      }

      // Calculate time ranges
      const now = new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const startOfThisWeek = new Date();
      startOfThisWeek.setDate(startOfThisWeek.getDate() - startOfThisWeek.getDay());

      // Fetch all data concurrently
      const [
        residentsCountResult,
        deceasedCountResult, 
        relocatedCountResult,
        householdsCountResult,
        announcementsCountResult,
        eventsCountResult,
        newResidentsThisMonthResult,
        newResidentsLastMonthResult,
        newHouseholdsThisMonthResult,
        newHouseholdsLastMonthResult,
        newAnnouncementsThisWeekResult,
        nextEventResult,
        monthlyDataResult,
        genderDataResult,
        barangayResult,
        residentsResult,
        householdsResult,
        announcementsResult,
        eventsResult,
        officialsResult
      ] = await Promise.all([
        // Count queries
        supabase.from('residents').select('*', { count: 'exact', head: true }).eq('brgyid', userProfile.brgyid).not('status', 'in', '("Deceased","Relocated")'),
        supabase.from('residents').select('*', { count: 'exact', head: true }).eq('brgyid', userProfile.brgyid).eq('status', 'Deceased'),
        supabase.from('residents').select('*', { count: 'exact', head: true }).eq('brgyid', userProfile.brgyid).eq('status', 'Relocated'),
        supabase.from('households').select('*', { count: 'exact', head: true }).eq('brgyid', userProfile.brgyid),
        supabase.from('announcements').select('*', { count: 'exact', head: true }).eq('brgyid', userProfile.brgyid),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('brgyid', userProfile.brgyid).gte('start_time', new Date().toISOString()),
        
        // Time-based counts
        supabase.from('residents').select('*', { count: 'exact', head: true }).eq('brgyid', userProfile.brgyid).gte('created_at', startOfThisMonth.toISOString()).not('status', 'in', '("Deceased","Relocated")'),
        supabase.from('residents').select('*', { count: 'exact', head: true }).eq('brgyid', userProfile.brgyid).gte('created_at', startOfLastMonth.toISOString()).lt('created_at', startOfThisMonth.toISOString()).not('status', 'in', '("Deceased","Relocated")'),
        supabase.from('households').select('*', { count: 'exact', head: true }).eq('brgyid', userProfile.brgyid).gte('created_at', startOfThisMonth.toISOString()),
        supabase.from('households').select('*', { count: 'exact', head: true }).eq('brgyid', userProfile.brgyid).gte('created_at', startOfLastMonth.toISOString()).lt('created_at', startOfThisMonth.toISOString()),
        supabase.from('announcements').select('*', { count: 'exact', head: true }).eq('brgyid', userProfile.brgyid).gte('created_at', startOfThisWeek.toISOString()),
        supabase.from('events').select('start_time').eq('brgyid', userProfile.brgyid).gte('start_time', new Date().toISOString()).order('start_time', { ascending: true }).limit(1).maybeSingle(),
        
        // Chart data
        supabase.from('residents').select('created_at').eq('brgyid', userProfile.brgyid).gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()).not('status', 'in', '("Deceased","Relocated")'),
        supabase.from('residents').select('gender').eq('brgyid', userProfile.brgyid).not('status', 'in', '("Deceased","Relocated")'),
        
        // Core data
        supabase.from('barangays').select('barangayname').eq('id', userProfile.brgyid).single(),
        supabase.from('residents').select('*').eq('brgyid', userProfile.brgyid).order('created_at', { ascending: false }).limit(50),
        supabase.from('households').select('*').eq('brgyid', userProfile.brgyid).order('created_at', { ascending: false }).limit(50),
        supabase.from('announcements').select('*').eq('brgyid', userProfile.brgyid).order('created_at', { ascending: false }).limit(10),
        supabase.from('events').select('*').eq('brgyid', userProfile.brgyid).gte('start_time', new Date().toISOString()).order('start_time', { ascending: true }).limit(5),
        supabase.from('official_positions').select(`
          id,
          position,
          term_start,
          term_end,
          is_current,
          officials (
            id,
            name,
            photo_url,
            brgyid
          )
        `).eq('officials.brgyid', userProfile.brgyid).eq('is_current', true).order('term_start', { ascending: true }).limit(10)
      ]);

      // Extract counts
      const newResidentsThisMonthCount = newResidentsThisMonthResult.count || 0;
      const newResidentsLastMonthCount = newResidentsLastMonthResult.count || 0;
      const newHouseholdsThisMonthCount = newHouseholdsThisMonthResult.count || 0;
      const newHouseholdsLastMonthCount = newHouseholdsLastMonthResult.count || 0;
      const newAnnouncementsThisWeekCount = newAnnouncementsThisWeekResult.count || 0;
      
      // Calculate next event days
      let nextEventDays = null;
      if (nextEventResult.data) {
        const eventDate = new Date(nextEventResult.data.start_time);
        const today = new Date();
        const diffTime = eventDate.getTime() - today.getTime();
        nextEventDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      // Calculate growth rates
      const residentGrowthRate = newResidentsLastMonthCount > 0 
        ? ((newResidentsThisMonthCount || 0) - (newResidentsLastMonthCount || 0)) / (newResidentsLastMonthCount || 1) * 100
        : newResidentsThisMonthCount > 0 ? 100 : 0;

      const householdGrowthRate = newHouseholdsLastMonthCount > 0 
        ? ((newHouseholdsThisMonthCount || 0) - (newHouseholdsLastMonthCount || 0)) / (newHouseholdsLastMonthCount || 1) * 100
        : newHouseholdsThisMonthCount > 0 ? 100 : 0;

      // Process chart data
      const monthlyResidents = processMonthlyData(monthlyDataResult.data || []);
      const genderDistribution = processGenderDistribution(genderDataResult.data || [], residentsCountResult.count || 0);

      // Process officials data
      const officialsWithPositions: OfficialWithPosition[] = (officialsResult.data || [])
        .filter(item => item.officials) 
        .map(item => ({
          id: item.officials.id,
          name: item.officials.name,
          photo_url: item.officials.photo_url,
          position: item.position,
          term_start: item.term_start,
          term_end: item.term_end
        }));

      // Store all data in the global store
      set((state) => ({
        data: {
          ...state.data,
          profile: userProfile,
          barangayName: barangayResult.data?.barangayname || '',
          stats: {
            totalResidents: residentsCountResult.count || 0,
            totalHouseholds: householdsCountResult.count || 0,
            activeAnnouncements: announcementsCountResult.count || 0,
            upcomingEvents: eventsCountResult.count || 0,
            newResidentsThisMonth: newResidentsThisMonthCount,
            newHouseholdsThisMonth: newHouseholdsThisMonthCount,
            newAnnouncementsThisWeek: newAnnouncementsThisWeekCount,
            nextEventDays,
            totalDeceased: deceasedCountResult.count || 0,
            totalRelocated: relocatedCountResult.count || 0,
            residentGrowthRate,
            householdGrowthRate,
          },
          charts: {
            monthlyResidents,
            genderDistribution,
          },
          residents: residentsResult.data || [],
          households: householdsResult.data || [],
          announcements: announcementsResult.data || [],
          events: eventsResult.data || [],
          officials: officialsWithPositions,
          isPreloaded: true,
        }
      }));

      console.log('Dashboard data pre-fetched successfully');
    } catch (error) {
      console.error('Error pre-fetching dashboard data:', error);
      throw error;
    }
  },
}));