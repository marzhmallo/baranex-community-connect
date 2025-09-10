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
import { FileText, Clock, CheckCircle, Package, Hourglass, Eye, XCircle, TrendingUp, Search, Plus, Edit, RefreshCw, FileX, History, PlusCircle, Bell, MessageCircle, BarChart3 } from "lucide-react";

const MobileDocumentsPage = () => {
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [requestsCurrentPage, setRequestsCurrentPage] = useState(1);
    const [trackingSearchQuery, setTrackingSearchQuery] = useState("");
    const [trackingFilter, setTrackingFilter] = useState("All Documents");
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [showViewDialog, setShowViewDialog] = useState(false);
    const [editingRequest, setEditingRequest] = useState<any>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [showTemplateDialog, setShowTemplateDialog] = useState(false);
    
    const { userProfile } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

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
    
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const [documentsData, requestsData] = await Promise.all([
                    supabase.from('document_types').select('*').order('name'),
                    userProfile?.id ? supabase.from('docrequests').select('*').eq('resident_id', userProfile.id).order('created_at', { ascending: false }) : { data: [], error: null }
                ]);
                setIsInitialLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setIsInitialLoading(false);
            }
        };
        
        if (userProfile?.id) {
            fetchAllData();
        } else {
            setIsInitialLoading(false);
        }
    }, [userProfile?.id]);

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

    const { data: documentTypes = [], isLoading: isLoadingTemplates } = useQuery({
        queryKey: ['document-types'],
        queryFn: async () => {
            const { data, error } = await supabase.from('document_types').select('*').order('name');
            if (error) throw error;
            return data || [];
        }
    });

    useEffect(() => {
        if (!userProfile?.id) return;
        const channel = supabase.channel('user-document-requests-realtime')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'docrequests',
                filter: `resident_id=eq.${userProfile.id}`
            }, () => refetch())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [userProfile?.id, refetch]);

    const getFilteredRequests = () => {
        let filteredByStatus = documentRequests;

        if (trackingFilter !== "All Documents") {
            filteredByStatus = documentRequests.filter(request => {
                const status = request.status.toLowerCase();
                switch (trackingFilter) {
                    case "Requests": return status === "request" || status === "pending";
                    case "Processing": return status === "processing" || status === "pending" || status === "for review";
                    case "Released": return status === "released" || status === "completed";
                    case "Rejected": return status === "rejected";
                    case "Ready": return status === "ready for pickup" || status === "ready" || status === "approved";
                    default: return true;
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
    const requestsPerPage = 6;
    const requestsStartIndex = (requestsCurrentPage - 1) * requestsPerPage;
    const requestsEndIndex = requestsStartIndex + requestsPerPage;
    const paginatedRequests = filteredRequests.slice(requestsStartIndex, requestsEndIndex);

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>;
            case 'processing':
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Processing</Badge>;
            case 'for review':
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">For Review</Badge>;
            case 'approved':
            case 'ready for pickup':
            case 'completed':
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Ready</Badge>;
            case 'rejected':
                return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
            case 'released':
                return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Released</Badge>;
            default:
                return <Badge variant="outline" className="bg-muted text-muted-foreground">{status}</Badge>;
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

    const matchesStatus = (requestStatus: string, targetStatus: string): boolean => {
        return requestStatus.toLowerCase() === targetStatus.toLowerCase();
    };

    const matchesAnyStatus = (requestStatus: string, targetStatuses: string[]): boolean => {
        return targetStatuses.some(status => matchesStatus(requestStatus, status));
    };

    if (isInitialLoading) {
        return <LocalizedLoadingScreen isLoading={isInitialLoading} />;
    }

    return (
        <div className="w-full p-4 bg-background min-h-screen">
            {/* Mobile Header */}
            <header className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        Documents
                    </h1>
                    <button 
                        onClick={async () => {
                            setIsRefreshing(true);
                            try {
                                await Promise.all([
                                    queryClient.invalidateQueries({ queryKey: ['user-document-requests'] }),
                                    queryClient.invalidateQueries({ queryKey: ['document-types'] })
                                ]);
                            } finally {
                                setIsRefreshing(false);
                            }
                        }}
                        disabled={isRefreshing}
                        className="p-2 rounded-lg hover:bg-accent"
                    >
                        <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                <p className="text-sm text-muted-foreground">Manage your official document requests</p>
            </header>

            {/* Mobile Status Overview - Horizontal Scroll */}
            <section className="mb-6">
                <h2 className="text-lg font-semibold text-foreground mb-3">Status Overview</h2>
                <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4">
                    <Card className="flex-shrink-0 w-32 text-center bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                        <CardContent className="p-3">
                            <div className="mb-2">
                                <Clock className="h-5 w-5 text-yellow-600 mx-auto" />
                            </div>
                            <p className="text-xl font-bold text-yellow-700">
                                {documentRequests.filter(req => matchesStatus(req.status, 'pending')).length}
                            </p>
                            <p className="text-xs font-medium text-yellow-600">Pending</p>
                        </CardContent>
                    </Card>
                    
                    <Card className="flex-shrink-0 w-32 text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                        <CardContent className="p-3">
                            <div className="mb-2">
                                <Hourglass className="h-5 w-5 text-blue-600 mx-auto" />
                            </div>
                            <p className="text-xl font-bold text-blue-700">
                                {documentRequests.filter(req => matchesStatus(req.status, 'processing')).length}
                            </p>
                            <p className="text-xs font-medium text-blue-600">Processing</p>
                        </CardContent>
                    </Card>
                    
                    <Card className="flex-shrink-0 w-32 text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                        <CardContent className="p-3">
                            <div className="mb-2">
                                <Package className="h-5 w-5 text-green-600 mx-auto" />
                            </div>
                            <p className="text-xl font-bold text-green-700">
                                {documentRequests.filter(req => matchesAnyStatus(req.status, ['ready', 'approved'])).length}
                            </p>
                            <p className="text-xs font-medium text-green-600">Ready</p>
                        </CardContent>
                    </Card>
                    
                    <Card className="flex-shrink-0 w-32 text-center bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                        <CardContent className="p-3">
                            <div className="mb-2">
                                <CheckCircle className="h-5 w-5 text-purple-600 mx-auto" />
                            </div>
                            <p className="text-xl font-bold text-purple-700">
                                {documentRequests.filter(req => matchesAnyStatus(req.status, ['released', 'completed'])).length}
                            </p>
                            <p className="text-xs font-medium text-purple-600">Released</p>
                        </CardContent>
                    </Card>
                    
                    <Card className="flex-shrink-0 w-32 text-center bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                        <CardContent className="p-3">
                            <div className="mb-2">
                                <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                            </div>
                            <p className="text-xl font-bold text-red-700">
                                {documentRequests.filter(req => matchesStatus(req.status, 'rejected')).length}
                            </p>
                            <p className="text-xs font-medium text-red-600">Rejected</p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Mobile Document Tracking */}
            <section className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">My Requests</h2>
                    <Button 
                        onClick={() => setShowRequestModal(true)}
                        size="sm"
                        className="bg-gradient-to-r from-primary to-secondary"
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Request
                    </Button>
                </div>

                {/* Mobile Search */}
                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input 
                            placeholder="Search by tracking ID..." 
                            value={trackingSearchQuery}
                            onChange={(e) => setTrackingSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Mobile Filter Pills */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
                    {["All Documents", "Requests", "Processing", "Ready", "Released", "Rejected"].map((filter) => (
                        <button 
                            key={filter}
                            onClick={() => setTrackingFilter(filter)}
                            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${
                                trackingFilter === filter 
                                    ? "bg-primary text-primary-foreground" 
                                    : "bg-muted text-muted-foreground hover:bg-accent"
                            }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>

                {/* Mobile Card View */}
                <div className="space-y-3">
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mb-2"></div>
                            <p className="text-sm">Loading your requests...</p>
                        </div>
                    ) : documentRequests.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <FileX className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No document requests found</p>
                        </div>
                    ) : paginatedRequests.map(request => (
                        <Card 
                            key={request.id} 
                            className="bg-card border hover:shadow-md transition-all cursor-pointer"
                            onClick={() => {
                                setSelectedRequest(request);
                                setShowViewDialog(true);
                            }}
                        >
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-foreground text-sm">{request.type}</h3>
                                        <p className="text-xs font-mono text-primary/80 mt-1">#{request.docnumber}</p>
                                    </div>
                                    {getStatusBadge(request.status)}
                                </div>
                                
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Requested by:</span>
                                        <span className="text-foreground font-medium">
                                            {request.profiles?.firstname && request.profiles?.lastname 
                                                ? `${request.profiles.firstname} ${request.profiles.lastname}` 
                                                : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Last update:</span>
                                        <span className="text-foreground">{formatDate(request.updated_at || request.created_at)}</span>
                                    </div>
                                </div>

                                <div className="flex justify-end mt-3 pt-2 border-t border-border">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedRequest(request);
                                            setShowViewDialog(true);
                                        }}
                                        className="text-xs"
                                    >
                                        <Eye className="h-4 w-4 mr-1" />
                                        View Details
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Available Documents Section */}
            <section className="mb-20">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Available Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {isLoadingTemplates ? (
                                <div className="text-center py-6 text-muted-foreground text-sm">Loading templates...</div>
                            ) : documentTypes.slice(0, 5).map(template => (
                                <div key={template.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="p-2 rounded bg-blue-100 flex-shrink-0">
                                            <FileText className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-medium text-foreground text-sm truncate">{template.name}</h4>
                                            <p className="text-xs text-muted-foreground">₱{template.fee || 0}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedTemplate(template);
                                            setShowTemplateDialog(true);
                                        }}
                                        className="p-1.5 text-muted-foreground hover:text-primary rounded"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Floating Action Button */}
            <Button
                onClick={() => setShowRequestModal(true)}
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-br from-primary to-secondary shadow-lg z-50"
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
                <DialogContent className="max-w-sm mx-4">
                    <DialogHeader>
                        <DialogTitle className="text-lg">Request Details</DialogTitle>
                    </DialogHeader>
                    
                    {selectedRequest && (
                        <div className="space-y-4">
                            <div className="bg-muted/50 rounded-lg p-3">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium">Status</span>
                                    {getStatusBadge(selectedRequest.status)}
                                </div>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Tracking ID</Label>
                                    <p className="font-mono font-semibold text-primary">{selectedRequest.docnumber}</p>
                                </div>
                                
                                <div>
                                    <Label className="text-xs text-muted-foreground">Document Type</Label>
                                    <p className="font-medium">{selectedRequest.type}</p>
                                </div>
                                
                                <div>
                                    <Label className="text-xs text-muted-foreground">Purpose</Label>
                                    <p className="text-sm">{selectedRequest.purpose}</p>
                                </div>
                                
                                <div>
                                    <Label className="text-xs text-muted-foreground">Request Date</Label>
                                    <p className="text-sm">{formatDate(selectedRequest.created_at)}</p>
                                </div>

                                {selectedRequest.amount && (
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Amount</Label>
                                        <p className="font-semibold text-green-600">₱{selectedRequest.amount}</p>
                                    </div>
                                )}

                                {selectedRequest.notes && (
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                        <Label className="text-xs text-amber-800 font-medium">Admin Notes</Label>
                                        <p className="text-xs text-amber-700 mt-1">{selectedRequest.notes}</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex justify-end pt-2">
                                <Button onClick={() => setShowViewDialog(false)} size="sm">
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Template Details Dialog */}
            <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                <DialogContent className="max-w-sm mx-4">
                    <DialogHeader>
                        <DialogTitle className="text-lg">Document Information</DialogTitle>
                    </DialogHeader>
                    
                    {selectedTemplate && (
                        <div className="space-y-4">
                            <div className="bg-muted/50 rounded-lg p-3">
                                <h3 className="font-semibold text-foreground mb-1">{selectedTemplate.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {selectedTemplate.description || 'Official barangay document'}
                                </p>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Fee</span>
                                    <span className="font-semibold">₱{selectedTemplate.fee || 0}</span>
                                </div>
                                
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Processing Time</span>
                                    <span>{selectedTemplate.processing_time || '1-3 days'}</span>
                                </div>
                                
                                {selectedTemplate.validity_days && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Validity</span>
                                        <span>{selectedTemplate.validity_days} days</span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex justify-end pt-2">
                                <Button onClick={() => setShowTemplateDialog(false)} size="sm">
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MobileDocumentsPage;