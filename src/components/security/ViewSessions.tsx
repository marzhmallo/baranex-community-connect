import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UAParser } from 'ua-parser-js'; // More accurate parser
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Laptop, Smartphone, Loader2, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

// components/ViewSessions.tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, RefreshCw } from 'lucide-react';

interface Session {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  user_agent: string;
  ip: string;
  aal: string;
  factor_id: string | null;
  not_after: string | null;
}

export const ViewSessions = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_user_sessions'); // Use the function you created

      if (error) {
        console.error('Error fetching sessions:', error);
        return;
      }

      setSessions(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const signOutOtherSessions = async () => {
    try {
      setSigningOut(true);
      const { error } = await supabase
        .rpc('delete_user_sessions'); // Use the function you created

      if (error) {
        console.error('Error signing out other sessions:', error);
        return;
      }

      // Refresh the sessions list
      await fetchSessions();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSigningOut(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const parseUserAgent = (userAgent: string) => {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
    return 'Unknown Device';
  };

  const getBrowserInfo = (userAgent: string) => {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown Browser';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>Loading your active sessions...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Active Sessions</CardTitle>
            <CardDescription>
              {sessions.length} active session{sessions.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          {sessions.length > 1 && (
            <Button
              variant="outline"
              onClick={signOutOtherSessions}
              disabled={signingOut}
            >
              {signingOut ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Sign Out Other Sessions
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active sessions found.
            </div>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant={session.aal === 'aal2' ? 'default' : 'secondary'}>
                        {session.aal === 'aal2' ? 'MFA' : 'Standard'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(session.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">{parseUserAgent(session.user_agent)} - {getBrowserInfo(session.user_agent)}</p>
                      <p className="text-muted-foreground">IP: {session.ip}</p>
                      <p className="text-muted-foreground text-xs">
                        Last active: {new Date(session.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                {session.id === sessions[0]?.id && (
                  <Badge variant="outline" className="ml-4">
                    Current
                  </Badge>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ViewSessions;