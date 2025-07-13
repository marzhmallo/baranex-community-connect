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

  // Get IP address and User-Agent for activity logging
  const getUserIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'Unknown';
    }
  };

  const userAgent = navigator.userAgent;
  const ipAddress = await getUserIP();

  return logActivity({
    user_id: userId,
    brgyid: userProfile.brgyid,
    action: 'user_sign_in',
    details: {
      username: userProfile.username || 'Unknown',
      email: userProfile.email || 'Unknown',
      role: userProfile.role || 'Unknown',
      timestamp: new Date().toISOString()
    },
    ip: ipAddress,
    agent: userAgent
  });
};

export const logUserSignOut = async (userId: string, userProfile: any) => {
  if (!userProfile?.brgyid) {
    console.warn('Cannot log sign out: missing brgyid');
    return;
  }

  // Get IP address and User-Agent for activity logging
  const getUserIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'Unknown';
    }
  };

  const userAgent = navigator.userAgent;
  const ipAddress = await getUserIP();

  return logActivity({
    user_id: userId,
    brgyid: userProfile.brgyid,
    action: 'user_sign_out',
    details: {
      username: userProfile.username || 'Unknown',
      email: userProfile.email || 'Unknown',
      role: userProfile.role || 'Unknown',
      timestamp: new Date().toISOString()
    },
    ip: ipAddress,
    agent: userAgent
  });
};