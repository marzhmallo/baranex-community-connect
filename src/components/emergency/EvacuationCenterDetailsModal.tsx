import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { MapPin, Users, Phone, Trash2 } from "lucide-react";

interface EvacCenter {
  id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  capacity: number;
  current_occupancy: number | null;
  status: string | null;
  contact_person?: string | null;
  contact_phone?: string | null;
  facilities?: string[] | null;
  notes?: string | null;
}

interface EvacuationCenterDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  center: EvacCenter | null;
  onUpdate?: () => void;
  onDelete?: () => void;
}

export const EvacuationCenterDetailsModal = ({ 
  isOpen, 
  onClose, 
  center,
  onUpdate,
  onDelete 
}: EvacuationCenterDetailsModalProps) => {
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!center) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'default';
      case 'full': return 'destructive';
      case 'closed': return 'secondary';
      case 'maintenance': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return '✅';
      case 'full': return '🔴';
      case 'closed': return '🚫';
      case 'maintenance': return '🔧';
      default: return '❓';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Available';
      case 'full': return 'Full';
      case 'closed': return 'Closed';
      case 'maintenance': return 'Maintenance';
      default: return status;
    }
  };

  const updateCenterStatus = async (status: 'available' | 'full' | 'closed' | 'maintenance') => {
    try {
      setUpdating(true);
      const { error } = await supabase
        .from('evacuation_centers')
        .update({ status })
        .eq('id', center.id);

      if (error) throw error;
      toast({ title: "Success", description: "Center status updated" });
      onUpdate?.();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update center status",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this evacuation center?')) return;
    
    try {
      setDeleting(true);
      const { error } = await supabase
        .from('evacuation_centers')
        .delete()
        .eq('id', center.id);

      if (error) throw error;
      
      toast({ title: "Success", description: "Evacuation center deleted successfully" });
      onDelete?.();
      onClose();
    } catch (error) {
      console.error('Error deleting evacuation center:', error);
      toast({
        title: "Error",
        description: "Failed to delete evacuation center",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] z-[3000]" style={{ zIndex: 3000 }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{getStatusIcon(center.status || 'available')}</span>
            {center.name}
          </DialogTitle>
          <DialogDescription>
            Evacuation center details and status management
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-6">
            <Badge variant={getStatusColor(center.status || 'available') as any}>
              {getStatusLabel(center.status || 'available')}
            </Badge>
            <Select
              value={center.status || 'available'} 
              onValueChange={(value: 'available' | 'full' | 'closed' | 'maintenance') => updateCenterStatus(value)}
              disabled={updating}
            >
              <SelectTrigger className="w-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="full">Full</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-1">Address:</h4>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {center.address}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Capacity:</h4>
              <p className="text-sm">
                {center.current_occupancy || 0} / {center.capacity} people
              </p>
            </div>
          </div>

          {center.facilities && center.facilities.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Facilities:</h4>
              <div className="flex flex-wrap gap-1">
                {center.facilities.map((facility, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {facility}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {center.contact_person && (
            <div>
              <h4 className="font-semibold mb-1">Contact Person:</h4>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{center.contact_person}</span>
                {center.contact_phone && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(`tel:${center.contact_phone}`)}
                  >
                    <Phone className="h-3 w-3" />
                    {center.contact_phone}
                  </Button>
                )}
              </div>
            </div>
          )}

          {center.notes && (
            <div>
              <h4 className="font-semibold mb-1">Notes:</h4>
              <p className="text-sm text-muted-foreground">{center.notes}</p>
            </div>
          )}

          {center.latitude && center.longitude && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Coordinates: {center.latitude.toFixed(6)}, {center.longitude.toFixed(6)}</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {deleting ? 'Deleting...' : 'Delete Center'}
          </Button>
          <Button onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};