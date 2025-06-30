
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Network, Send, Users, Home, FileText, Calendar, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const NexusPage = () => {
  const [selectedDataType, setSelectedDataType] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [targetBarangay, setTargetBarangay] = useState('');
  const [barangays, setBarangays] = useState<any[]>([]);
  const [dataItems, setDataItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [transferMode, setTransferMode] = useState<'single' | 'bulk'>('single');
  const [currentUserBarangay, setCurrentUserBarangay] = useState<string>('');

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

      const { data, error } = await query.order('created_at', { ascending: false }).limit(100);

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
      const { data: transferRequest, error: transferError } = await supabase
        .from('dnexus')
        .insert({
          source: currentUserBarangay,
          destination: targetBarangay,
          datatype: selectedDataType,
          dataid: selectedItems,
          status: 'pending',
          initiator: user.id,
          notes: `Transfer request for ${selectedItems.length} ${selectedDataType} record(s) in ${transferMode} mode`,
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <Network className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">The Nexus</h1>
          <p className="text-muted-foreground">Transfer data between barangays</p>
        </div>
      </div>

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
    </div>
  );
};

export default NexusPage;
