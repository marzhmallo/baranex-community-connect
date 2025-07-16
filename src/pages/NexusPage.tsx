
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Network, Send, Users, Home, FileText, Calendar, MessageSquare, CheckCircle, XCircle, Clock, ArrowRight, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const NexusPage = () => {
  const [selectedDataType, setSelectedDataType] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [targetBarangay, setTargetBarangay] = useState('');
  const [barangays, setBarangays] = useState<any[]>([]);
  const [dataItems, setDataItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [transferMode, setTransferMode] = useState<'single' | 'bulk'>('single');
  const [currentUserBarangay, setCurrentUserBarangay] = useState<string>('');
  const [transferNotes, setTransferNotes] = useState('');
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  const dataTypes = [
    { value: 'residents', label: 'Residents', icon: Users },
    { value: 'households', label: 'Households', icon: Home },
    { value: 'officials', label: 'Officials', icon: Users },
    { value: 'announcements', label: 'Announcements', icon: MessageSquare },
    { value: 'events', label: 'Events', icon: Calendar },
    { value: 'documents', label: 'Documents', icon: FileText },
  ];

  useEffect(() => {
    fetchBarangays();
    getCurrentUserBarangay();
  }, []);

  useEffect(() => {
    if (currentUserBarangay) {
      fetchTransferRequests();
    }
  }, [currentUserBarangay]);

  useEffect(() => {
    if (selectedDataType) {
      fetchDataItems();
    }
  }, [selectedDataType]);

  const getCurrentUserBarangay = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('brgyid')
          .eq('id', user.id)
          .single();
        
        if (profile?.brgyid) {
          setCurrentUserBarangay(profile.brgyid);
        }
      }
    } catch (error) {
      console.error('Error fetching user barangay:', error);
    }
  };

  const fetchBarangays = async () => {
    try {
      const { data, error } = await supabase
        .from('barangays')
        .select('id, barangayname, municipality, province')
        .order('barangayname');

      if (error) throw error;
      setBarangays(data || []);
    } catch (error) {
      console.error('Error fetching barangays:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch barangays',
        variant: 'destructive',
      });
    }
  };

  const fetchTransferRequests = async () => {
    try {
      // Fetch incoming requests (where current barangay is destination)
      const { data: incomingData, error: incomingError } = await supabase
        .from('dnexus')
        .select('*')
        .eq('destination', currentUserBarangay)
        .order('created_at', { ascending: false });

      if (incomingError) throw incomingError;

      // Fetch additional data for incoming requests
      const incomingWithDetails = await Promise.all(
        (incomingData || []).map(async (request) => {
          // Get source barangay info
          const { data: sourceBarangay } = await supabase
            .from('barangays')
            .select('barangayname, municipality, province')
            .eq('id', request.source)
            .single();

          // Get initiator profile info
          const { data: initiatorProfile } = await supabase
            .from('profiles')
            .select('firstname, lastname')
            .eq('id', request.initiator)
            .single();

          return {
            ...request,
            source_barangay: sourceBarangay,
            initiator_profile: initiatorProfile
          };
        })
      );

      setIncomingRequests(incomingWithDetails);

      // Fetch outgoing requests (where current barangay is source)
      const { data: outgoingData, error: outgoingError } = await supabase
        .from('dnexus')
        .select('*')
        .eq('source', currentUserBarangay)
        .order('created_at', { ascending: false });

      if (outgoingError) throw outgoingError;

      // Fetch additional data for outgoing requests
      const outgoingWithDetails = await Promise.all(
        (outgoingData || []).map(async (request) => {
          // Get destination barangay info
          const { data: destinationBarangay } = await supabase
            .from('barangays')
            .select('barangayname, municipality, province')
            .eq('id', request.destination)
            .single();

          // Get reviewer profile info if exists
          let reviewerProfile = null;
          if (request.reviewer) {
            const { data } = await supabase
              .from('profiles')
              .select('firstname, lastname')
              .eq('id', request.reviewer)
              .single();
            reviewerProfile = data;
          }

          return {
            ...request,
            destination_barangay: destinationBarangay,
            reviewer_profile: reviewerProfile
          };
        })
      );

      setOutgoingRequests(outgoingWithDetails);
    } catch (error) {
      console.error('Error fetching transfer requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch transfer requests',
        variant: 'destructive',
      });
    }
  };

  const fetchDataItems = async () => {
    try {
      setLoading(true);
      let query;
      let selectFields = 'id';

      switch (selectedDataType) {
        case 'residents':
          selectFields = 'id, first_name, last_name, purok';
          query = supabase.from('residents').select(selectFields);
          break;
        case 'households':
          selectFields = 'id, name, purok, address';
          query = supabase.from('households').select(selectFields);
          break;
        case 'officials':
          selectFields = 'id, name, position_no';
          query = supabase.from('officials').select(selectFields);
          break;
        case 'announcements':
          selectFields = 'id, title, category, created_at';
          query = supabase.from('announcements').select(selectFields);
          break;
        case 'events':
          selectFields = 'id, title, start_time, location';
          query = supabase.from('events').select(selectFields);
          break;
        case 'documents':
          selectFields = 'id, name, description';
          query = supabase.from('document_types').select(selectFields);
          break;
        default:
          return;
      }

      const { data, error } = await query
        .eq('brgyid', currentUserBarangay)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setDataItems(data || []);
    } catch (error) {
      console.error('Error fetching data items:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch data items',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleItemToggle = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === dataItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(dataItems.map(item => item.id));
    }
  };

  const handleTransfer = async () => {
    if (!selectedDataType || !targetBarangay || selectedItems.length === 0 || !currentUserBarangay) {
      toast({
        title: 'Error',
        description: 'Please select data type, target barangay, and items to transfer',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create transfer request using the existing dnexus table
      // Convert plural data types to singular for database function compatibility
      const normalizedDataType = selectedDataType === 'residents' ? 'resident' : selectedDataType;
      
      const { data: transferRequest, error: transferError } = await supabase
        .from('dnexus')
        .insert({
          source: currentUserBarangay,
          destination: targetBarangay,
          datatype: normalizedDataType,
          dataid: selectedItems,
          status: 'pending',
          initiator: user.id,
          notes: transferNotes || `Transfer request for ${selectedItems.length} ${selectedDataType} record(s) in ${transferMode} mode`,
        })
        .select()
        .single();

      if (transferError) throw transferError;

      toast({
        title: 'Transfer Request Sent',
        description: `Transfer request has been sent to the target barangay. Awaiting approval.`,
      });

      // Reset form
      setSelectedItems([]);
      setSelectedDataType('');
      setTargetBarangay('');
      setTransferNotes('');
      
      // Refresh requests
      fetchTransferRequests();
    } catch (error) {
      console.error('Error creating transfer request:', error);
      toast({
        title: 'Error',
        description: 'Failed to create transfer request',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReviewRequest = (request: any) => {
    setSelectedRequest(request);
    setReviewDialogOpen(true);
  };

  const handleApproveReject = async (approve: boolean) => {
    if (!selectedRequest) return;

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('Processing transfer request:', selectedRequest.id, 'Approve:', approve);
      console.log('Current user barangay:', currentUserBarangay);
      console.log('Request destination:', selectedRequest.destination);

      if (approve) {
        // Use the secure accept_data_transfer function
        console.log('Calling accept_data_transfer function for request:', selectedRequest.id);
        const { data, error: transferError } = await supabase.rpc('accept_data_transfer', {
          transferid: selectedRequest.id
        });

        if (transferError) {
          console.error('Error calling accept_data_transfer:', transferError);
          throw transferError;
        }

        console.log('Transfer function result:', data);
      } else {
        // For rejection, only update the status
        console.log('Rejecting transfer request');
        const { error: statusError } = await supabase
          .from('dnexus')
          .update({
            status: 'rejected',
            reviewer: user.id,
          })
          .eq('id', selectedRequest.id)
          .eq('destination', currentUserBarangay)
          .eq('status', 'pending');

        if (statusError) {
          console.error('Error updating request status:', statusError);
          throw statusError;
        }

        console.log('Successfully rejected transfer request');
      }

      toast({
        title: approve ? 'Transfer Approved' : 'Transfer Rejected',
        description: approve 
          ? 'Data has been successfully transferred to your barangay'
          : 'Transfer request has been rejected',
      });

      setReviewDialogOpen(false);
      setSelectedRequest(null);
      fetchTransferRequests();
    } catch (error) {
      console.error('Error processing request:', error);
      toast({
        title: 'Error',
        description: 'Failed to process transfer request: ' + (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getItemDisplayName = (item: any) => {
    switch (selectedDataType) {
      case 'residents':
        return `${item.first_name} ${item.last_name} (${item.purok})`;
      case 'households':
        return `${item.name} - ${item.address}`;
      case 'officials':
        return `${item.name} (Position ${item.position_no})`;
      case 'announcements':
        return `${item.title} (${item.category})`;
      case 'events':
        return `${item.title} - ${item.location}`;
      case 'documents':
        return `${item.name}`;
      default:
        return item.name || item.title || 'Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingIncomingCount = incomingRequests.filter(req => req.status === 'pending').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <Network className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">The Nexus</h1>
          <p className="text-muted-foreground">Transfer data between barangays</p>
        </div>
        {pendingIncomingCount > 0 && (
          <Badge variant="destructive" className="ml-auto">
            <Bell className="h-3 w-3 mr-1" />
            {pendingIncomingCount} Pending
          </Badge>
        )}
      </div>

      <Tabs defaultValue="new-transfer" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="new-transfer">New Transfer</TabsTrigger>
          <TabsTrigger value="incoming">
            Incoming Requests
            {pendingIncomingCount > 0 && (
              <Badge variant="secondary" className="ml-2">{pendingIncomingCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="outgoing">Outgoing Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="new-transfer">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Transfer Configuration */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Transfer Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Transfer Mode</label>
                  <div className="flex space-x-4 mt-2">
                    <Button
                      variant={transferMode === 'single' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTransferMode('single')}
                    >
                      Single
                    </Button>
                    <Button
                      variant={transferMode === 'bulk' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTransferMode('bulk')}
                    >
                      Bulk
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Data Type</label>
                  <Select value={selectedDataType} onValueChange={setSelectedDataType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select data type" />
                    </SelectTrigger>
                    <SelectContent>
                      {dataTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center space-x-2">
                            <type.icon className="h-4 w-4" />
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Target Barangay</label>
                  <Select value={targetBarangay} onValueChange={setTargetBarangay}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target barangay" />
                    </SelectTrigger>
                    <SelectContent>
                      {barangays
                        .filter(barangay => barangay.id !== currentUserBarangay)
                        .map((barangay) => (
                        <SelectItem key={barangay.id} value={barangay.id}>
                          {barangay.barangayname}, {barangay.municipality}, {barangay.province}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Transfer Notes (Optional)</label>
                  <Textarea
                    placeholder="Add a note about this transfer..."
                    value={transferNotes}
                    onChange={(e) => setTransferNotes(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <Button 
                  onClick={handleTransfer} 
                  className="w-full" 
                  disabled={loading || selectedItems.length === 0 || !targetBarangay}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Transfer Request
                </Button>
              </CardContent>
            </Card>

            {/* Data Selection */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Select Data Items
                    {selectedItems.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {selectedItems.length} selected
                      </Badge>
                    )}
                  </CardTitle>
                  {dataItems.length > 0 && (
                    <Button variant="outline" size="sm" onClick={handleSelectAll}>
                      {selectedItems.length === dataItems.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!selectedDataType ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Select a data type to view available items
                  </div>
                ) : loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading data items...
                  </div>
                ) : dataItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No items found for this data type
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {dataItems.map((item) => (
                      <div key={item.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={() => handleItemToggle(item.id)}
                        />
                        <div className="flex-1">
                          <span className="text-sm">{getItemDisplayName(item)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="incoming">
          <Card>
            <CardHeader>
              <CardTitle>Incoming Transfer Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {incomingRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No incoming transfer requests
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>From</TableHead>
                      <TableHead>Data Type</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incomingRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {request.source_barangay?.barangayname}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              by {request.initiator_profile?.firstname} {request.initiator_profile?.lastname}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{request.datatype}</TableCell>
                        <TableCell>{request.dataid?.length || 0} items</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(request.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {request.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReviewRequest(request)}
                            >
                              Review
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outgoing">
          <Card>
            <CardHeader>
              <CardTitle>Outgoing Transfer Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {outgoingRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No outgoing transfer requests
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>To</TableHead>
                      <TableHead>Data Type</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Reviewed By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outgoingRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          {request.destination_barangay?.barangayname}
                        </TableCell>
                        <TableCell className="capitalize">{request.datatype}</TableCell>
                        <TableCell>{request.dataid?.length || 0} items</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(request.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {request.reviewer_profile?.firstname && request.reviewer_profile?.lastname ? 
                            `${request.reviewer_profile.firstname} ${request.reviewer_profile.lastname}` : 
                            '-'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Review Transfer Request</DialogTitle>
            <DialogDescription>
              Carefully review this transfer request before making a decision.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">From Barangay</label>
                  <p className="text-sm">{selectedRequest.source_barangay?.barangayname}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Data Type</label>
                  <p className="text-sm capitalize">{selectedRequest.datatype}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Number of Items</label>
                  <p className="text-sm">{selectedRequest.dataid?.length || 0} items</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Requested By</label>
                  <p className="text-sm">
                    {selectedRequest.initiator_profile?.firstname} {selectedRequest.initiator_profile?.lastname}
                  </p>
                </div>
              </div>
              
              {selectedRequest.notes && (
                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <p className="text-sm bg-muted p-2 rounded">{selectedRequest.notes}</p>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="destructive"
                  onClick={() => handleApproveReject(false)}
                  disabled={loading}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleApproveReject(true)}
                  disabled={loading}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept & Transfer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NexusPage;
