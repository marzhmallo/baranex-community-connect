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
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="text-center space-y-4 py-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                        <Laptop className="h-10 w-10 text-primary" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-foreground">
                        Active Sessions
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Monitor and manage all devices currently signed into your account. Keep your account secure by reviewing active sessions.
                    </p>
                </div>

                {/* Sessions Card */}
                <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
                    <CardHeader className="space-y-4 pb-8">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-2xl font-semibold flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                Connected Devices
                            </CardTitle>
                            <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                                {sessions?.length || 0} active
                            </div>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                        {sessions?.length === 0 ? (
                            <div className="text-center py-12 space-y-4">
                                <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
                                    <Smartphone className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <p className="text-muted-foreground">No active sessions found</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {sessions?.map((session, index) => {
                                    const parser = new UAParser(session.user_agent);
                                    const result = parser.getResult();
                                    const deviceInfo = `${result.os.name || 'Unknown OS'} - ${result.browser.name || 'Unknown Browser'}`;
                                    const isMobile = result.device.type === 'mobile';
                                    const isCurrentSession = index === 0; // Assume first is current

                                    return (
                                        <div 
                                            key={session.id} 
                                            className={`relative group p-6 rounded-xl border transition-all duration-300 hover:shadow-lg ${
                                                isCurrentSession 
                                                    ? 'bg-primary/5 border-primary/20 ring-2 ring-primary/10' 
                                                    : 'bg-card hover:bg-muted/30 border-border'
                                            }`}
                                        >
                                            {isCurrentSession && (
                                                <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
                                                    Current
                                                </div>
                                            )}
                                            
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start space-x-4">
                                                    <div className={`p-3 rounded-lg ${isMobile ? 'bg-blue-500/10' : 'bg-green-500/10'}`}>
                                                        {isMobile ? 
                                                            <Smartphone className={`h-6 w-6 ${isMobile ? 'text-blue-600' : 'text-green-600'}`} /> : 
                                                            <Laptop className={`h-6 w-6 ${isMobile ? 'text-blue-600' : 'text-green-600'}`} />
                                                        }
                                                    </div>
                                                    <div className="space-y-2">
                                                        <h3 className="font-semibold text-foreground text-lg">
                                                            {deviceInfo}
                                                        </h3>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                <div className="w-1 h-1 rounded-full bg-muted-foreground"></div>
                                                                <span>IP Address: {session.ip}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                <div className="w-1 h-1 rounded-full bg-muted-foreground"></div>
                                                                <span>
                                                                    Connected: {new Date(session.created_at).toLocaleString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex flex-col items-end space-y-2">
                                                    <div className={`w-3 h-3 rounded-full ${
                                                        isCurrentSession ? 'bg-green-500' : 'bg-yellow-500'
                                                    } animate-pulse`}></div>
                                                    <span className="text-xs text-muted-foreground">
                                                        {isMobile ? 'Mobile' : 'Desktop'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Security Actions */}
                        <div className="pt-8 border-t border-border">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                    <LogOut className="h-5 w-5 text-destructive" />
                                    Security Actions
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Sign out from all other devices to secure your account. This will keep you logged in on this device only.
                                </p>
                                <Button 
                                    onClick={() => signOutMutation.mutate()} 
                                    variant="destructive"
                                    size="lg"
                                    className="w-full h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                                    disabled={signOutMutation.isPending || sessions?.length <= 1}
                                >
                                    <LogOut className="h-5 w-5 mr-3" />
                                    {signOutMutation.isPending ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Signing out from other devices...
                                        </>
                                    ) : (
                                        'Sign Out From All Other Devices'
                                    )}
                                </Button>
                                {sessions?.length <= 1 && (
                                    <p className="text-xs text-muted-foreground text-center">
                                        No other devices to sign out from
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ViewSessions;