import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UAParser } from 'ua-parser-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Laptop, Smartphone, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Session {
    id: string;
    userid: string;
    created_at: string;
    updated_at: string;
    factor_id: string;
    aal: string;
    not_after: string;
    user_agent: string;
    ip: string;
}

const ViewSessions = () => {
    const { data: sessions, isLoading, refetch } = useQuery({
        queryKey: ['user-sessions'],
        queryFn: async () => {
            const { data, error } = await (supabase as any).rpc('get_user_sessions');
            
            if (error) throw error;
            return (data as Session[]) || [];
        }
    });

    const handleSignOutEverywhere = async () => {
        if (window.confirm("Are you sure you want to sign out from all other devices?")) {
            try {
                // First delete all other sessions from database
                const { error: deleteError } = await (supabase as any).rpc('delete_user_sessions');
                if (deleteError) throw deleteError;

                // Then sign out globally
                const { error } = await supabase.auth.signOut({ scope: 'global' });
                if (error) {
                    toast({
                        title: "Error",
                        description: "Error signing out: " + error.message,
                        variant: "destructive",
                    });
                } else {
                    toast({
                        title: "Success",
                        description: "You have been signed out from all other sessions.",
                    });
                    refetch();
                }
            } catch (error) {
                toast({
                    title: "Error",
                    description: "An unexpected error occurred",
                    variant: "destructive",
                });
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-6">
            <div className="container mx-auto max-w-4xl">
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground">Active Sessions</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            This is a list of devices that have recently logged into your account.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {sessions?.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    No active sessions found.
                                </p>
                            ) : (
                                sessions?.map(session => {
                                    const parser = new UAParser(session.user_agent || '');
                                    const result = parser.getResult();
                                    const deviceInfo = `${result.os.name || 'Unknown OS'} - ${result.browser.name || 'Unknown Browser'}`;
                                    const isMobile = result.device.type === 'mobile';

                                    return (
                                        <div key={session.id} className="p-4 border border-border rounded-lg flex justify-between items-center bg-card">
                                            <div className="flex items-center space-x-4">
                                                {isMobile ? 
                                                    <Smartphone className="text-muted-foreground w-5 h-5" /> : 
                                                    <Laptop className="text-muted-foreground w-5 h-5" />
                                                }
                                                <div>
                                                    <p className="font-semibold text-foreground">{deviceInfo}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        IP: {session.ip || 'Unknown'} • Session: {session.aal || 'Unknown'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Created: {new Date(session.created_at || '').toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {sessions && sessions.length > 0 && (
                            <Button 
                                onClick={handleSignOutEverywhere} 
                                variant="destructive"
                                className="mt-6 w-full"
                            >
                                Sign Out From All Devices
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ViewSessions;