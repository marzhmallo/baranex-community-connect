import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { MapPin, AlertTriangle, Trash2 } from "lucide-react";

interface DisasterZone {
  id: string;
  zone_name: string;
  zone_type: string;
  risk_level: 'low' | 'medium' | 'high';
  notes: string | null;
  polygon_coords: [number, number][];
}

interface DisasterZoneDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  zone: DisasterZone | null;
  onDelete?: () => void;
}

export const DisasterZoneDetailsModal = ({ 
  isOpen, 
  onClose, 
  zone,
  onDelete 
}: DisasterZoneDetailsModalProps) => {
  const [deleting, setDeleting] = useState(false);

  if (!zone) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'flood': return '🌊';
      case 'fire': return '🔥';
      case 'landslide': return '⛰️';
      case 'earthquake': return '🌍';
      case 'typhoon': return '🌀';
      default: return '⚠️';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'default';
      case 'medium': return 'secondary';
      case 'high': return 'destructive';
      default: return 'outline';
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this disaster zone?')) return;
    
    try {
      setDeleting(true);
      const { error } = await supabase
        .from('disaster_zones')
        .delete()
        .eq('id', zone.id);

      if (error) throw error;
      
      toast({ title: "Success", description: "Disaster zone deleted successfully" });
      onDelete?.();
      onClose();
    } catch (error) {
      console.error('Error deleting disaster zone:', error);
      toast({
        title: "Error",
        description: "Failed to delete disaster zone",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] z-[3000]" style={{ zIndex: 3000 }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{getTypeIcon(zone.zone_type)}</span>
            {zone.zone_name}
          </DialogTitle>
          <DialogDescription>
            Disaster zone details and information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={getRiskColor(zone.risk_level) as any}>
              {zone.risk_level} risk
            </Badge>
            <Badge variant="outline" className="capitalize">
              {zone.zone_type.replace('_', ' ')} zone
            </Badge>
          </div>

          {zone.notes && (
            <div>
              <h4 className="font-semibold mb-2">Notes:</h4>
              <p className="text-sm text-muted-foreground">{zone.notes}</p>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>Coordinates: {zone.polygon_coords?.length || 0} points mapped</span>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {deleting ? 'Deleting...' : 'Delete Zone'}
          </Button>
          <Button onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};