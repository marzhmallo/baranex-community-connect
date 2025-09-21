import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HouseholdActivityLog {
  id: string;
  user_id: string;
  action: string;
  details: any;
  ip?: string;
  agent?: string;
  created_at: string;
  brgyid: string;
}

export const useHouseholdActivityLogs = (householdId: string, page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: ['household-activity-logs', householdId, page, limit],
    queryFn: async () => {
      const offset = (page - 1) * limit;
      
      // Query for logs where the household ID appears in the details
      const { data, error, count } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact' })
        .or(`details->>household_id.eq.${householdId},details->>record_id.eq.${householdId}`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching household activity logs:', error);
        throw error;
      }

      return {
        logs: data as HouseholdActivityLog[],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      };
    },
    enabled: !!householdId,
  });
};