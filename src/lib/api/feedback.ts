
import { supabase } from "@/integrations/supabase/client";
import { FeedbackReport, FeedbackType, FeedbackStatus } from "@/lib/types/feedback";

export const feedbackAPI = {
  // Get all feedback reports (admin)
  getAllReports: async (brgyid: string, filters?: {
    type?: FeedbackType;
    status?: FeedbackStatus;
    search?: string;
  }) => {
    let query = supabase
      .from('feedback_reports')
      .select(`
        *,
        profiles!feedback_reports_user_id_fkey(firstname, lastname, email)
      `)
      .eq('brgyid', brgyid)
      .order('created_at', { ascending: false });

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.search) {
      query = query.or(`description.ilike.%${filters.search}%,category.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data?.map(report => ({
      ...report,
      user_name: report.profiles ? `${report.profiles.firstname} ${report.profiles.lastname}` : 'Unknown User',
      user_email: report.profiles?.email || ''
    })) as FeedbackReport[];
  },

  // Get user's own reports
  getUserReports: async (userId: string) => {
    const { data, error } = await supabase
      .from('feedback_reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as FeedbackReport[];
  },

  // Create new report
  createReport: async (report: Omit<FeedbackReport, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('feedback_reports')
      .insert(report)
      .select()
      .single();

    if (error) throw error;
    return data as FeedbackReport;
  },

  // Update report status (admin)
  updateReportStatus: async (reportId: string, status: FeedbackStatus, adminNotes?: string) => {
    const updateData: any = { status, updated_at: new Date().toISOString() };
    if (adminNotes !== undefined) {
      updateData.admin_notes = adminNotes;
    }

    const { data, error } = await supabase
      .from('feedback_reports')
      .update(updateData)
      .eq('id', reportId)
      .select()
      .single();

    if (error) throw error;
    return data as FeedbackReport;
  },

  // Update report (user)
  updateReport: async (reportId: string, updates: Partial<FeedbackReport>) => {
    const { data, error } = await supabase
      .from('feedback_reports')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', reportId)
      .select()
      .single();

    if (error) throw error;
    return data as FeedbackReport;
  },

  // Delete report
  deleteReport: async (reportId: string) => {
    const { error } = await supabase
      .from('feedback_reports')
      .delete()
      .eq('id', reportId);

    if (error) throw error;
  }
};
