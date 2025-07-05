import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { MapPin, Clock, Navigation, Trash2 } from "lucide-react";

interface SafeRoute {
  id: string;
  route_name: string;
  route_coords: [number, number][];
  start_point: { lat: number; lng: number; description?: string };
  end_point: { lat: number; lng: number; description?: string };
  distance_km?: number | null;
  estimated_time_minutes?: number | null;
}

interface EvacuationRouteDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: SafeRoute | null;
  onDelete?: () => void;
}

export const EvacuationRouteDetailsModal = ({ 
  isOpen, 
  onClose, 
  route,
  onDelete 
}: EvacuationRouteDetailsModalProps) => {
  const [deleting, setDeleting] = useState(false);

  if (!route) return null;

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this evacuation route?')) return;
    
    try {
      setDeleting(true);
      const { error } = await supabase
        .from('evacuation_routes')
        .delete()
        .eq('id', route.id);

      if (error) throw error;
      
      toast({ title: "Success", description: "Evacuation route deleted successfully" });
      onDelete?.();
      onClose();
    } catch (error) {
      console.error('Error deleting evacuation route:', error);
      toast({
        title: "Error",
        description: "Failed to delete evacuation route",
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
            <Navigation className="h-5 w-5 text-blue-600" />
            {route.route_name}
          </DialogTitle>
          <DialogDescription>
            Evacuation route details and path information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Badge variant="outline">Evacuation Route</Badge>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <span className="text-sm font-medium">Start Point:</span>
                <p className="text-sm text-muted-foreground">
                  {route.start_point?.description || 'Start location'}
                </p>
                {route.start_point && (
                  <p className="text-xs text-muted-foreground">
                    Coordinates: {route.start_point.lat.toFixed(6)}, {route.start_point.lng.toFixed(6)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div>
                <span className="text-sm font-medium">End Point:</span>
                <p className="text-sm text-muted-foreground">
                  {route.end_point?.description || 'End location'}
                </p>
                {route.end_point && (
                  <p className="text-xs text-muted-foreground">
                    Coordinates: {route.end_point.lat.toFixed(6)}, {route.end_point.lng.toFixed(6)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {route.distance_km && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-sm font-medium">Distance:</span>
                  <p className="text-sm text-muted-foreground">{route.distance_km} km</p>
                </div>
              </div>
            )}

            {route.estimated_time_minutes && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-sm font-medium">Est. Time:</span>
                  <p className="text-sm text-muted-foreground">{route.estimated_time_minutes} min</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Navigation className="h-4 w-4" />
            <span>Route points: {route.route_coords?.length || 0} coordinates mapped</span>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {deleting ? 'Deleting...' : 'Delete Route'}
          </Button>
          <Button onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};