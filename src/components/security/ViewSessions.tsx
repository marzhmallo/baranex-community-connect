import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UAParser } from 'ua-parser-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Laptop, Smartphone, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Define a type for the session data returned by your function
type UserSession = {
    id: string;
    user_id: string;
    created_at: string;
    user_agent: string;
    ip: string;
};

const ViewSessions = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // 1. FETCH SESSIONS using your new get_user_sessions function
    const { data: sessions, isLoading } = useQuery<UserSession[]>({
        queryKey: ['user-sessions'],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_user_sessions');
            if (error) throw error;
            return data || [];
        }
    });

    // 2. SIGN OUT from other sessions using your new delete_user_sessions function
    const signOutMutation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase.rpc('delete_user_sessions');
            if (error) throw error;
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "You have been signed out from all other devices.",
            });
            // Refetch the sessions list to show only the current one remains
            queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: "Failed to sign out from other sessions. " + error.message,
                variant: "destructive",
            });
        }
    });

    if (isLoading) {
        return <p>Loading active sessions...</p>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <p className="text-sm text-muted-foreground pt-1">
                    This is a list of devices currently logged into your account.
                </p>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {sessions?.map(session => {
                        const parser = new UAParser(session.user_agent);
                        const result = parser.getResult();
                        const deviceInfo = `${result.os.name || ''} - ${result.browser.name || 'Unknown'}`;
                        const isMobile = result.device.type === 'mobile';

                        return (
                            <div key={session.id} className="p-4 border rounded-lg flex justify-between items-center bg-card">
                                <div className="flex items-center space-x-4">
                                    {isMobile ? <Smartphone className="text-muted-foreground" /> : <Laptop className="text-muted-foreground" />}
                                    <div>
                                        <p className="font-semibold text-foreground">{deviceInfo}</p>
                                        <p className="text-sm text-muted-foreground">IP: {session.ip}</p>
                                        <p className="text-xs text-gray-500">
                                            Signed in: {new Date(session.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <Button 
                    onClick={() => signOutMutation.mutate()} 
                    variant="destructive"
                    className="mt-6 w-full"
                    disabled={signOutMutation.isPending}
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    {signOutMutation.isPending ? 'Signing out...' : 'Sign Out From All Other Devices'}
                </Button>
            </CardContent>
        </Card>
    );
};

export default ViewSessions;