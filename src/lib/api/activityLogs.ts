import { supabase } from "@/integrations/supabase/client";

export interface ActivityLogEntry {
  user_id: string;
  brgyid: string;
  action: string;
  details: Record<string, any>;
  ip?: string;
  agent?: string;
}

export const logActivity = async (entry: ActivityLogEntry) => {
  try {
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: entry.user_id,
        brgyid: entry.brgyid,
        action: entry.action,
        details: entry.details,
        ip: entry.ip || null,
        agent: entry.agent || null,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error logging activity:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in logActivity:', error);
    return { success: false, error };
  }
};

export const logUserSignIn = async (userId: string, userProfile: any) => {
  if (!userProfile?.brgyid) {
    console.warn('Cannot log sign in: missing brgyid');
    return;
  }

  return logActivity({
    user_id: userId,
    brgyid: userProfile.brgyid,
    action: 'user_sign_in',
    details: {
      username: userProfile.username || 'Unknown',
      email: userProfile.email || 'Unknown',
      role: userProfile.role || 'Unknown',
      timestamp: new Date().toISOString(),
      ip_address: 'Not captured', // Could be enhanced to capture real IP
      user_agent: navigator.userAgent
    }
  });
};

export const logUserSignOut = async (userId: string, userProfile: any) => {
  if (!userProfile?.brgyid) {
    console.warn('Cannot log sign out: missing brgyid');
    return;
  }

  return logActivity({
    user_id: userId,
    brgyid: userProfile.brgyid,
    action: 'user_sign_out',
    details: {
      username: userProfile.username || 'Unknown',
      email: userProfile.email || 'Unknown',
      role: userProfile.role || 'Unknown',
      timestamp: new Date().toISOString(),
      session_duration: 'Not calculated', // Could be enhanced to track session duration
      user_agent: navigator.userAgent
    }
  });
};