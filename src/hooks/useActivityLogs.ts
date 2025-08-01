import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  details: any;
  created_at: string;
  ip?: string;
  agent?: string;
  brgyid: string;
}

export interface UserProfile {
  id: string;
  firstname?: string;
  lastname?: string;
  username: string;
  email: string;
  role: string;
}

interface ActivityFilters {
  searchQuery: string;
  selectedUser: string;
  selectedAction: string;
  selectedDate: string;
  currentPage: number;
  itemsPerPage: number;
}

interface CachedData {
  activities: ActivityLog[];
  userProfiles: Record<string, UserProfile>;
  totalItems: number;
  lastUpdated: number;
  filters: ActivityFilters;
}

export const useActivityLogs = (filters: ActivityFilters) => {
  const { user } = useAuth();
  
  // Get cached data function
  const getCachedData = useCallback((brgyid: string): CachedData | null => {
    try {
      const cached = localStorage.getItem(`activityLogs_${brgyid}`);
      if (!cached) return null;
      
      const data = JSON.parse(cached);
      // Check if cache is stale (older than 2 minutes)
      const isStale = Date.now() - data.lastUpdated > 2 * 60 * 1000;
      
      return isStale ? null : data;
    } catch {
      return null;
    }
  }, []);

  // Initialize state with cached data if available
  const [activities, setActivities] = useState<ActivityLog[]>(() => {
    if (user?.id) {
      // Get user profile to get brgyid (this might be sync issue, but we'll handle it)
      return [];
    }
    return [];
  });
  
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [brgyid, setBrgyid] = useState<string>('');

  // Function to save data to cache
  const saveToCache = useCallback((brgyid: string, data: Partial<CachedData>) => {
    try {
      const existingCache = getCachedData(brgyid) || {
        activities: [],
        userProfiles: {},
        totalItems: 0,
        lastUpdated: 0,
        filters: filters
      };
      
      const newCache = {
        ...existingCache,
        ...data,
        lastUpdated: Date.now(),
        filters
      };
      
      localStorage.setItem(`activityLogs_${brgyid}`, JSON.stringify(newCache));
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }, [filters, getCachedData]);

  // Fetch user's brgyid first
  const fetchUserBrgyid = useCallback(async () => {
    if (!user?.id) return null;
    
    try {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('brgyid')
        .eq('id', user.id)
        .single();
      
      if (userProfile?.brgyid) {
        setBrgyid(userProfile.brgyid);
        return userProfile.brgyid;
      }
    } catch (error) {
      console.error('Error fetching user brgyid:', error);
    }
    return null;
  }, [user?.id]);

  // Main fetch function
  const fetchActivityLogs = useCallback(async (forceRefresh = false) => {
    if (!user?.id) return;

    const userBrgyid = await fetchUserBrgyid();
    if (!userBrgyid) return;

    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cachedData = getCachedData(userBrgyid);
      if (cachedData && 
          JSON.stringify(cachedData.filters) === JSON.stringify(filters)) {
        setActivities(cachedData.activities);
        setUserProfiles(cachedData.userProfiles);
        setTotalItems(cachedData.totalItems);
        return;
      }
    }

    try {
      setLoading(true);
      
      let query = supabase
        .from('activity_logs')
        .select('*', { count: 'exact' })
        .eq('brgyid', userBrgyid)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.searchQuery) {
        query = query.or(`action.ilike.%${filters.searchQuery}%,details.ilike.%${filters.searchQuery}%`);
      }

      if (filters.selectedAction !== 'all') {
        query = query.eq('action', filters.selectedAction);
      }

      if (filters.selectedDate) {
        const startDate = new Date(filters.selectedDate);
        const endDate = new Date(filters.selectedDate);
        endDate.setDate(endDate.getDate() + 1);
        query = query.gte('created_at', startDate.toISOString()).lt('created_at', endDate.toISOString());
      }

      // Pagination
      const from = (filters.currentPage - 1) * filters.itemsPerPage;
      const to = from + filters.itemsPerPage - 1;
      query = query.range(from, to);

      const { data: logs, error, count } = await query;

      if (error) throw error;

      const fetchedActivities = logs || [];
      setActivities(fetchedActivities);
      setTotalItems(count || 0);

      // Fetch user profiles for all unique user_ids
      const userIds = [...new Set(fetchedActivities.map(log => log.user_id))];
      let profileMap: Record<string, UserProfile> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, firstname, lastname, username, email, role')
          .in('id', userIds);

        profileMap = profiles?.reduce((acc, profile) => ({
          ...acc,
          [profile.id]: profile
        }), {}) || {};
        
        setUserProfiles(profileMap);
      }

      // Save to cache
      saveToCache(userBrgyid, {
        activities: fetchedActivities,
        userProfiles: profileMap,
        totalItems: count || 0
      });

    } catch (error) {
      console.error('Error fetching activity logs:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user?.id, filters, getCachedData, saveToCache, fetchUserBrgyid]);

  // Load cached data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      if (!user?.id) return;
      
      const userBrgyid = await fetchUserBrgyid();
      if (!userBrgyid) return;
      
      const cachedData = getCachedData(userBrgyid);
      if (cachedData) {
        setActivities(cachedData.activities);
        setUserProfiles(cachedData.userProfiles);
        setTotalItems(cachedData.totalItems);
      }
    };
    
    loadInitialData();
  }, [user?.id, getCachedData, fetchUserBrgyid]);

  // Fetch when filters change
  useEffect(() => {
    if (user?.id && brgyid) {
      fetchActivityLogs();
    }
  }, [user?.id, brgyid, filters.searchQuery, filters.selectedUser, filters.selectedAction, filters.selectedDate, filters.currentPage, filters.itemsPerPage, fetchActivityLogs]);

  // Set up real-time subscription
  useEffect(() => {
    if (!brgyid) return;

    const channel = supabase
      .channel('activity-logs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_logs',
          filter: `brgyid=eq.${brgyid}`
        },
        (payload) => {
          console.log('Real-time activity log update:', payload);
          // Refresh data when there's a change
          fetchActivityLogs(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [brgyid, fetchActivityLogs]);

  const refreshData = useCallback(() => {
    fetchActivityLogs(true);
  }, [fetchActivityLogs]);

  return {
    activities,
    userProfiles,
    loading,
    totalItems,
    refreshData,
    brgyid
  };
};