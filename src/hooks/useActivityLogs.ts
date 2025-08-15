import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import type { DateRange } from "react-day-picker";

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  details: any;
  created_at: string;
  ip?: string;
  agent?: string;
  brgyid: string;
}

interface UserProfile {
  id: string;
  firstname?: string;
  lastname?: string;
  username: string;
  email: string;
  role: string;
}

interface UseActivityLogsParams {
  searchQuery: string;
  selectedUser: string;
  selectedAction: string;
  dateRange: DateRange | undefined;
  currentPage: number;
  itemsPerPage: number;
}

interface UseActivityLogsReturn {
  activities: ActivityLog[];
  userProfiles: Record<string, UserProfile>;
  loading: boolean;
  totalItems: number;
  refetch: () => void;
}

const CACHE_KEY = 'activity_logs_cache';
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

interface CacheData {
  data: ActivityLog[];
  profiles: Record<string, UserProfile>;
  timestamp: number;
  brgyid: string;
}

export function useActivityLogs(params: UseActivityLogsParams): UseActivityLogsReturn {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [userBrgyId, setUserBrgyId] = useState<string | null>(null);

  // Get user's brgy ID
  useEffect(() => {
    const getUserBrgyId = async () => {
      if (!user) return;
      
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('brgyid')
        .eq('id', user.id)
        .single();
      
      if (userProfile?.brgyid) {
        setUserBrgyId(userProfile.brgyid);
      }
    };

    getUserBrgyId();
  }, [user]);

  // Cache utilities
  const getCachedData = useCallback((): CacheData | null => {
    if (!userBrgyId) return null;
    
    try {
      const cached = localStorage.getItem(`${CACHE_KEY}_${userBrgyId}`);
      if (!cached) return null;
      
      const data: CacheData = JSON.parse(cached);
      const now = Date.now();
      
      if (now - data.timestamp > CACHE_DURATION) {
        localStorage.removeItem(`${CACHE_KEY}_${userBrgyId}`);
        return null;
      }
      
      return data;
    } catch {
      return null;
    }
  }, [userBrgyId]);

  const setCachedData = useCallback((data: ActivityLog[], profiles: Record<string, UserProfile>) => {
    if (!userBrgyId) return;
    
    const cacheData: CacheData = {
      data,
      profiles,
      timestamp: Date.now(),
      brgyid: userBrgyId
    };
    
    try {
      localStorage.setItem(`${CACHE_KEY}_${userBrgyId}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache activity logs:', error);
    }
  }, [userBrgyId]);

  // Filter cached data based on current filters
  const filteredActivities = useMemo(() => {
    if (!activities.length) return [];

    let filtered = [...activities];

    // Apply search filter
    if (params.searchQuery.trim()) {
      const query = params.searchQuery.toLowerCase();
      filtered = filtered.filter(activity => 
        activity.action.toLowerCase().includes(query) ||
        JSON.stringify(activity.details || {}).toLowerCase().includes(query) ||
        userProfiles[activity.user_id]?.firstname?.toLowerCase().includes(query) ||
        userProfiles[activity.user_id]?.lastname?.toLowerCase().includes(query) ||
        userProfiles[activity.user_id]?.username?.toLowerCase().includes(query)
      );
    }

    // Apply action filter
    if (params.selectedAction !== 'all') {
      filtered = filtered.filter(activity => activity.action === params.selectedAction);
    }

    // Apply user filter (by role)
    if (params.selectedUser !== 'all') {
      filtered = filtered.filter(activity => {
        const userRole = userProfiles[activity.user_id]?.role;
        return userRole === params.selectedUser;
      });
    }

    // Apply date range filter
    if (params.dateRange?.from) {
      filtered = filtered.filter(activity => {
        const activityDate = new Date(activity.created_at);
        const fromDate = new Date(params.dateRange!.from!);
        fromDate.setHours(0, 0, 0, 0);
        
        if (params.dateRange?.to) {
          const toDate = new Date(params.dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          return activityDate >= fromDate && activityDate <= toDate;
        } else {
          // If only 'from' date is selected, show activities from that date onwards
          return activityDate >= fromDate;
        }
      });
    }

    return filtered;
  }, [activities, userProfiles, params]);

  // Paginated results
  const paginatedActivities = useMemo(() => {
    const startIndex = (params.currentPage - 1) * params.itemsPerPage;
    const endIndex = startIndex + params.itemsPerPage;
    return filteredActivities.slice(startIndex, endIndex);
  }, [filteredActivities, params.currentPage, params.itemsPerPage]);

  // Update total items when filtered data changes
  useEffect(() => {
    setTotalItems(filteredActivities.length);
  }, [filteredActivities]);

  const fetchActivityLogs = useCallback(async (useCache = true) => {
    if (!user || !userBrgyId) return;

    try {
      // Try to use cached data first
      if (useCache) {
        const cached = getCachedData();
        if (cached) {
          setActivities(cached.data);
          setUserProfiles(cached.profiles);
          setLoading(false);
          return;
        }
      }

      setLoading(true);

      // Fetch all logs for this barangay (we'll filter client-side)
      const { data: logs, error } = await supabase
        .from('activity_logs')
        .select(`
          *,
          profiles!inner(role)
        `)
        .eq('brgyid', userBrgyId)
        .in('profiles.role', ['user', 'admin', 'staff'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Extract just the activity log data (without the joined profile data)
      const cleanedLogs = logs?.map(log => {
        const { profiles, ...activityLog } = log as any;
        return activityLog;
      }) || [];

      setActivities(cleanedLogs);

      // Fetch user profiles for all unique user_ids
      const userIds = [...new Set(cleanedLogs?.map(log => log.user_id) || [])];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, firstname, lastname, username, email, role')
          .in('id', userIds)
          .in('role', ['user', 'admin', 'staff']);

        const profileMap = profiles?.reduce((acc, profile) => ({
          ...acc,
          [profile.id]: profile
        }), {}) || {};

        setUserProfiles(profileMap);

        // Cache the data
        setCachedData(cleanedLogs || [], profileMap);
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch activity logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, userBrgyId, getCachedData, setCachedData, toast]);

  // Set up real-time subscription
  useEffect(() => {
    if (!userBrgyId) return;

    const channel = supabase
      .channel('activity_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_logs',
          filter: `brgyid=eq.${userBrgyId}`
        },
        (payload) => {
          // Refresh data when changes occur
          fetchActivityLogs(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userBrgyId, fetchActivityLogs]);

  // Initial fetch
  useEffect(() => {
    fetchActivityLogs();
  }, [fetchActivityLogs]);

  const refetch = useCallback(() => {
    fetchActivityLogs(false);
  }, [fetchActivityLogs]);

  return {
    activities: paginatedActivities,
    userProfiles,
    loading,
    totalItems,
    refetch
  };
}