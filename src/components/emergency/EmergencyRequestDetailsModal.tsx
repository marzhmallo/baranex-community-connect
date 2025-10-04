import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { MapPin, Clock, Phone, AlertTriangle, ExternalLink, Flame, Droplets, Heart, Wrench, Users } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface EmergencyRequest {
  id: string;
  request_type: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  details: string | null;
  created_at: string;
  resident_id: string;
  brgyid: string;
}

interface EmergencyRequestDetailsModalProps {
  requestId: string | null;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

const requestTypeIcons: Record<string, any> = {
  'Fire': Flame,
  'Medical Emergency': Heart,
  'Flood': Droplets,
  'Infrastructure Damage': Wrench,
  'Rescue Operation': Users,
};

const statusConfig = {
  'Pending': { color: 'bg-red-500', textColor: 'text-red-500', icon: '🔴' },
  'In Progress': { color: 'bg-yellow-500', textColor: 'text-yellow-500', icon: '🟡' },
  'Responded': { color: 'bg-green-500', textColor: 'text-green-500', icon: '🟢' },
};

export const EmergencyRequestDetailsModal = ({
  requestId,
  isOpen,
  onClose,
  isAdmin = false,
}: EmergencyRequestDetailsModalProps) => {
  const [request, setRequest] = useState<EmergencyRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    if (requestId && isOpen) {
      fetchRequestDetails();
    }
  }, [requestId, isOpen]);

  const fetchRequestDetails = async () => {
    if (!requestId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('emergency_requests' as any)
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) throw error;
      setRequest(data as any);
      setNewStatus((data as any).status);
    } catch (error) {
      console.error('Error fetching request details:', error);
      toast({
        title: "Error",
        description: "Failed to load request details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!request || !isAdmin) return;
    
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('emergency_requests' as any)
        .update({ status: newStatus })
        .eq('id', request.id);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Request status changed to ${newStatus}`,
      });

      setRequest({ ...request, status: newStatus });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const openInMaps = () => {
    if (request?.latitude && request?.longitude) {
      window.open(
        `https://www.google.com/maps?q=${request.latitude},${request.longitude}`,
        '_blank'
      );
    }
  };

  if (loading || !request) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const Icon = requestTypeIcons[request.request_type] || AlertTriangle;
  const status = statusConfig[request.status as keyof typeof statusConfig] || statusConfig['Pending'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${status.color} bg-opacity-10`}>
              <Icon className={`h-6 w-6 ${status.textColor}`} />
            </div>
            <div>
              <div className="text-xl font-bold">{request.request_type}</div>
              <div className="text-sm font-normal text-muted-foreground">
                Request ID: {request.id.slice(0, 8)}...
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Section */}
          <div>
            <h3 className="font-semibold mb-2">Status</h3>
            <Badge className="text-sm py-1 px-3">
              {status.icon} {request.status}
            </Badge>
          </div>

          <Separator />

          {/* Time Information */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time Information
            </h3>
            <div className="space-y-1 text-sm">
              <p><span className="text-muted-foreground">Reported:</span> {format(new Date(request.created_at), 'PPpp')}</p>
              <p><span className="text-muted-foreground">Time Elapsed:</span> {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}</p>
            </div>
          </div>

          <Separator />

          {/* Details */}
          {request.details && (
            <>
              <div>
                <h3 className="font-semibold mb-2">Request Details</h3>
                <p className="text-sm leading-relaxed bg-muted p-3 rounded-md">
                  {request.details}
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Location */}
          {request.latitude && request.longitude && (
            <>
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </h3>
                <div className="space-y-2">
                  <p className="text-sm font-mono bg-muted p-2 rounded">
                    {request.latitude.toFixed(6)}, {request.longitude.toFixed(6)}
                  </p>
                  <Button onClick={openInMaps} variant="outline" size="sm" className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Google Maps
                  </Button>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Admin Actions */}
          {isAdmin && (
            <div>
              <h3 className="font-semibold mb-3">Admin Actions</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">Update Status</label>
                  <div className="flex gap-2">
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">🔴 Pending</SelectItem>
                        <SelectItem value="In Progress">🟡 In Progress</SelectItem>
                        <SelectItem value="Responded">🟢 Responded</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleUpdateStatus} 
                      disabled={updating || newStatus === request.status}
                    >
                      {updating ? 'Updating...' : 'Update'}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Admin Notes</label>
                  <Textarea
                    placeholder="Add notes about this request..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
