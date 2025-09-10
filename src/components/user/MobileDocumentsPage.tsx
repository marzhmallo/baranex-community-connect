import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import LocalizedLoadingScreen from "@/components/ui/LocalizedLoadingScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import DocumentRequestModal from "./DocumentRequestModal";
import { FileText, Clock, CheckCircle, Package, Hourglass, Eye, XCircle, TrendingUp, Search, Plus, Edit, RefreshCw, FileX, History } from "lucide-react";

const MobileDocumentsPage = () => {
    // State management
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showIssueForm, setShowIssueForm] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [requestsCurrentPage, setRequestsCurrentPage] = useState(1);
    const [trackingSearchQuery, setTrackingSearchQuery] = useState("");
    const [trackingFilter, setTrackingFilter] = useState("All Documents");
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [showViewDialog, setShowViewDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [editingRequest, setEditingRequest] = useState<any>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [showTemplateDialog, setShowTemplateDialog] = useState(false);
    
    const { userProfile } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Data types
    type EnrichedDocumentRequest = {
        id: string; 
        resident_id: string; 
        type: string; 
        status: string;
        purpose: string; 
        docnumber: string; 
        created_at: string; 
        updated_at: string;
        amount?: number;
        method?: string;
        notes?: string;
        receiver?: any;
        profiles?: { 
            id: string; 
            firstname: string; 
            lastname: string; 
        } | null;
    } & Record<string, any>;
    
    // Initial loading
    useEffect(() => {
        const fetchData = async () => {
            try {
                if (userProfile?.id) {
                    await Promise.all([
                        supabase.from('docrequests').select('*').eq('resident_id', userProfile.id),
                        supabase.from('document_types').select('*')
                    ]);
                }
                setIsInitialLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setIsInitialLoading(false);
            }
        };
        
        if (userProfile !== undefined) {
            fetchData();
        }
    }, [userProfile]);

    // Fetch document requests
    const { data: documentRequests = [], isLoading, refetch } = useQuery({
        queryKey: ['user-document-requests', userProfile?.id],
        queryFn: async (): Promise<EnrichedDocumentRequest[]> => {
            if (!userProfile?.id) return [];
            
            const { data: requests, error: requestsError } = await supabase
                .from('docrequests')
                .select('*')
                .eq('resident_id', userProfile.id)
                .order('created_at', { ascending: false });
                
            if (requestsError) throw requestsError;
            if (!requests || requests.length === 0) return [];

            const residentIds = [...new Set(requests.map(req => req.resident_id))];
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, firstname, lastname')
                .in('id', residentIds);

            if (profilesError) {
                console.error('Error fetching profiles:', profilesError);
                return requests.map(request => ({ ...request, profiles: null }));
            }

            const profileMap = (profiles || []).reduce((acc: any, profile: any) => {
                acc[profile.id] = profile;
                return acc;
            }, {});

            return requests.map(request => ({
                ...request,
                profiles: profileMap[request.resident_id] || null
            }));
        },
        enabled: !!userProfile?.id,
    });

    // Real-time subscription
    useEffect(() => {
        if (!userProfile?.id) return;
        
        const channel = supabase
            .channel('user-document-requests-realtime')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'docrequests', 
                filter: `resident_id=eq.${userProfile.id}` 
            }, () => refetch())
            .subscribe();
            
        return () => { supabase.removeChannel(channel); };
    }, [userProfile?.id, refetch]);

    // Fetch document types
    const { data: documentTypes = [] } = useQuery({
        queryKey: ['document-types'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('document_types')
                .select('*')
                .order('name');
            if (error) throw error;
            return data || [];
        }
    });

    // Helper functions
    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-50">Pending</Badge>;
            case 'processing':
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">Processing</Badge>;
            case 'for review':
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">For Review</Badge>;
            case 'approved':
            case 'ready for pickup':
            case 'ready':
            case 'completed':
                return <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">Ready for Pickup</Badge>;
            case 'rejected':
                return <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50">Rejected</Badge>;
            case 'released':
                return <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-50">Released</Badge>;
            default:
                return <Badge variant="outline" className="bg-gray-50 text-gray-700 hover:bg-gray-50">{status}</Badge>;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Filtering logic
    const getFilteredRequests = () => {
        let filteredByStatus = documentRequests;

        if (trackingFilter !== "All Documents") {
            filteredByStatus = documentRequests.filter(request => {
                const status = request.status.toLowerCase();
                switch (trackingFilter) {
                    case "Requests":
                        return status === "request" || status === "pending";
                    case "Processing":
                        return status === "processing" || status === "pending" || status === "for review";
                    case "Released":
                        return status === "released" || status === "completed";
                    case "Rejected":
                        return status === "rejected";
                    case "Ready":
                        return status === "ready for pickup" || status === "ready" || status === "approved";
                    default:
                        return true;
                }
            });
        }

        if (trackingSearchQuery.trim()) {
            filteredByStatus = filteredByStatus.filter(request => 
                request.docnumber?.toLowerCase().includes(trackingSearchQuery.toLowerCase())
            );
        }

        return filteredByStatus;
    };

    const filteredRequests = getFilteredRequests();
    
    if (isInitialLoading) {
        return <LocalizedLoadingScreen isLoading={isInitialLoading} />;
    }

    return (
        <div className="w-full p-4 bg-background min-h-screen">
            {/* Page Header */}
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-foreground mb-1">Documents</h1>
                <p className="text-sm text-muted-foreground">Manage your official document requests.</p>
            </header>

            {/* Status Overview */}
            <section className="mb-8">
                <h2 className="text-lg font-semibold text-foreground mb-4">Status Overview</h2>
                <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4">
                    <Card className="flex-shrink-0 w-36 text-center border-yellow-500/30">
                        <CardContent className="p-3">
                            <p className="text-2xl font-bold text-yellow-600">{documentRequests.filter(req => req.status.toLowerCase() === 'pending').length}</p>
                            <p className="text-xs font-medium text-yellow-600">Pending</p>
                        </CardContent>
                    </Card>
                    <Card className="flex-shrink-0 w-36 text-center border-blue-500/30">
                        <CardContent className="p-3">
                            <p className="text-2xl font-bold text-blue-600">{documentRequests.filter(req => req.status.toLowerCase() === 'processing').length}</p>
                            <p className="text-xs font-medium text-blue-600">Processing</p>
                        </CardContent>
                    </Card>
                    <Card className="flex-shrink-0 w-36 text-center border-green-500/30">
                        <CardContent className="p-3">
                            <p className="text-2xl font-bold text-green-600">{documentRequests.filter(req => ['ready', 'approved', 'ready for pickup', 'completed'].includes(req.status.toLowerCase())).length}</p>
                            <p className="text-xs font-medium text-green-600">Ready</p>
                        </CardContent>
                    </Card>
                    <Card className="flex-shrink-0 w-36 text-center border-purple-500/30">
                        <CardContent className="p-3">
                            <p className="text-2xl font-bold text-purple-600">{documentRequests.filter(req => ['released', 'completed'].includes(req.status.toLowerCase())).length}</p>
                            <p className="text-xs font-medium text-purple-600">Released</p>
                        </CardContent>
                    </Card>
                    <Card className="flex-shrink-0 w-36 text-center border-red-500/30">
                        <CardContent className="p-3">
                            <p className="text-2xl font-bold text-red-600">{documentRequests.filter(req => req.status.toLowerCase() === 'rejected').length}</p>
                            <p className="text-xs font-medium text-red-600">Rejected</p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Document Tracking Section */}
            <section className="mb-8">
                <Card>
                    <CardHeader>
                        <CardTitle>My Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Search and Filters */}
                        <div className="space-y-3 mb-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input 
                                    placeholder="Search by tracking ID..." 
                                    className="pl-10"
                                    value={trackingSearchQuery}
                                    onChange={(e) => setTrackingSearchQuery(e.target.value)}
                                />
                            </div>
                            
                            {/* Filter pills */}
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {["All Documents", "Requests", "Processing", "Released", "Ready", "Rejected"].map((filter) => (
                                    <button
                                        key={filter}
                                        onClick={() => setTrackingFilter(filter)}
                                        className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                                            trackingFilter === filter 
                                                ? "bg-primary text-primary-foreground" 
                                                : "bg-muted text-muted-foreground hover:bg-accent"
                                        }`}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Mobile Card View */}
                        <div className="space-y-3">
                            {isLoading ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mb-2"></div>
                                    <p>Loading your document requests...</p>
                                </div>
                            ) : filteredRequests.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <FileX className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>No document requests found</p>
                                </div>
                            ) : (
                                filteredRequests.map(request => (
                                    <Card 
                                        key={request.id} 
                                        className="bg-card hover:bg-accent/50 cursor-pointer transition-colors" 
                                        onClick={() => { 
                                            setSelectedRequest(request); 
                                            setShowViewDialog(true); 
                                        }}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-semibold text-foreground truncate">{request.type}</p>
                                                    <p className="text-xs font-mono text-primary">{request.docnumber}</p>
                                                </div>
                                                <div className="ml-2 flex-shrink-0">
                                                    {getStatusBadge(request.status)}
                                                </div>
                                            </div>
                                            <div className="text-xs text-muted-foreground border-t border-border pt-2">
                                                Last Update: {formatDate(request.updated_at || request.created_at)}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Document Library Section */}
            <section>
                <Card>
                    <CardHeader>
                        <CardTitle>Available Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {documentTypes.slice(0, 5).map(template => (
                                <div key={template.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="p-2 rounded bg-blue-100 dark:bg-blue-900/20 flex-shrink-0">
                                            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-medium text-foreground text-sm truncate">{template.name}</h4>
                                            <p className="text-xs text-muted-foreground">Fee: ₱{template.fee || 0}</p>
                                        </div>
                                    </div>
                                    <Badge className="bg-green-500 hover:bg-green-500 text-white ml-2">Active</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Floating Action Button */}
            <Button 
                onClick={() => setShowRequestModal(true)} 
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary shadow-lg z-50" 
                size="icon"
            >
                <Plus className="h-6 w-6" />
            </Button>

            {/* Modals */}
            {showRequestModal && (
                <DocumentRequestModal 
                    onClose={() => {
                        setShowRequestModal(false);
                        setEditingRequest(null);
                    }} 
                    editingRequest={editingRequest} 
                />
            )}

            {/* View Request Dialog */}
            <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Document Details</DialogTitle>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Document Type</Label>
                                <p className="text-sm text-muted-foreground">{selectedRequest.type}</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Tracking ID</Label>
                                <p className="text-sm font-mono text-primary">{selectedRequest.docnumber}</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Status</Label>
                                {getStatusBadge(selectedRequest.status)}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Purpose</Label>
                                <p className="text-sm text-muted-foreground">{selectedRequest.purpose}</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Request Date</Label>
                                <p className="text-sm text-muted-foreground">{formatDate(selectedRequest.created_at)}</p>
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button onClick={() => setShowViewDialog(false)}>Close</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MobileDocumentsPage;