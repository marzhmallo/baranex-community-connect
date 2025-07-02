import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Save, Trash2, Edit } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import L from 'leaflet';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface DisasterZone {
  id: string;
  zone_name: string;
  zone_type: 'flood' | 'fire' | 'landslide' | 'earthquake' | 'typhoon' | 'other';
  polygon_coords: any;
  notes?: string;
  risk_level: string;
}

interface DisasterZoneMapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zone?: DisasterZone;
  onSave: (polygonCoords: any) => void;
}

const DisasterZoneMapDialog = ({ open, onOpenChange, zone, onSave }: DisasterZoneMapDialogProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Initialize map when dialog opens
  useEffect(() => {
    if (!open) {
      // Cleanup when dialog closes
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        drawnItemsRef.current = null;
      }
      return;
    }

    // Initialize map when dialog opens
    if (open && mapRef.current && !mapInstanceRef.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        initializeMap();
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Load existing zone polygon when zone changes
  useEffect(() => {
    if (mapInstanceRef.current && zone && zone.polygon_coords) {
      loadExistingPolygon();
    }
  }, [zone, mapInstanceRef.current]);

  const initializeMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      console.log('Initializing map...');
      
      // Create map with proper center and zoom
      const map = L.map(mapRef.current).setView([12.8797, 121.7740], 6);

      // Add tile layer with error handling
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      });

      tileLayer.on('loading', () => {
        console.log('Tiles loading...');
      });

      tileLayer.on('load', () => {
        console.log('Tiles loaded successfully');
      });

      tileLayer.on('tileerror', (e) => {
        console.error('Tile loading error:', e);
      });

      tileLayer.addTo(map);

      // Initialize feature group for drawn items
      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);

      // Store references
      mapInstanceRef.current = map;
      drawnItemsRef.current = drawnItems;

      // Force map to invalidate size after initialization
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
          console.log('Map size invalidated');
        }
      }, 300);

      console.log('Map initialized successfully');
    } catch (error) {
      console.error('Error initializing map:', error);
      toast({
        title: "Error",
        description: "Failed to initialize map",
        variant: "destructive",
      });
    }
  };

  const loadExistingPolygon = () => {
    if (!mapInstanceRef.current || !drawnItemsRef.current || !zone?.polygon_coords) return;

    try {
      const coords = zone.polygon_coords;
      if (coords.type === 'Polygon' && coords.coordinates && coords.coordinates[0]) {
        // Convert coordinates to Leaflet format
        const latLngs = coords.coordinates[0].map((coord: [number, number]) => [coord[1], coord[0]]);
        
        const polygon = L.polygon(latLngs, {
          color: getZoneColor(zone.zone_type),
          fillColor: getZoneColor(zone.zone_type),
          fillOpacity: 0.3
        });

        drawnItemsRef.current.addLayer(polygon);
        mapInstanceRef.current.fitBounds(polygon.getBounds());
      }
    } catch (error) {
      console.error('Error loading existing polygon:', error);
    }
  };

  const getZoneColor = (type: string) => {
    switch (type) {
      case 'flood': return '#3b82f6'; // blue
      case 'fire': return '#ef4444'; // red
      case 'landslide': return '#f59e0b'; // amber
      case 'earthquake': return '#8b5cf6'; // purple
      case 'typhoon': return '#06b6d4'; // cyan
      default: return '#6b7280'; // gray
    }
  };

  const startDrawing = () => {
    if (!mapInstanceRef.current || !drawnItemsRef.current) return;

    // Clear existing polygons
    drawnItemsRef.current.clearLayers();
    setIsDrawing(true);

    // Create drawing handler
    const polygon = new L.Polygon([]);
    let isDrawingPolygon = false;
    let currentPoints: L.LatLng[] = [];

    const drawingHandler = (e: L.LeafletMouseEvent) => {
      if (!isDrawingPolygon) {
        // Start drawing
        isDrawingPolygon = true;
        currentPoints = [e.latlng];
        polygon.setLatLngs([currentPoints]);
        polygon.addTo(drawnItemsRef.current!);
      } else {
        // Add point
        currentPoints.push(e.latlng);
        polygon.setLatLngs([currentPoints]);
      }
    };

    const finishDrawing = (e: L.LeafletMouseEvent) => {
      if (isDrawingPolygon && currentPoints.length >= 3) {
        // Finish polygon (right-click or double-click)
        mapInstanceRef.current!.off('click', drawingHandler);
        mapInstanceRef.current!.off('dblclick', finishDrawing);
        mapInstanceRef.current!.off('contextmenu', finishDrawing);
        setIsDrawing(false);
        
        // Set final styling
        polygon.setStyle({
          color: zone ? getZoneColor(zone.zone_type) : '#6b7280',
          fillColor: zone ? getZoneColor(zone.zone_type) : '#6b7280',
          fillOpacity: 0.3
        });

        toast({
          title: "Polygon Complete",
          description: "Right-click or double-click to finish drawing. Click Save to save the zone.",
        });
      }
    };

    mapInstanceRef.current.on('click', drawingHandler);
    mapInstanceRef.current.on('dblclick', finishDrawing);
    mapInstanceRef.current.on('contextmenu', finishDrawing);

    toast({
      title: "Drawing Mode",
      description: "Click on the map to start drawing the zone boundary. Right-click or double-click to finish.",
    });
  };

  const clearDrawing = () => {
    if (drawnItemsRef.current) {
      drawnItemsRef.current.clearLayers();
      setIsDrawing(false);
    }
  };

  const savePolygon = () => {
    if (!drawnItemsRef.current) return;

    const layers = drawnItemsRef.current.getLayers();
    if (layers.length === 0) {
      toast({
        title: "No Zone Drawn",
        description: "Please draw a zone boundary before saving.",
        variant: "destructive",
      });
      return;
    }

    const polygon = layers[0] as L.Polygon;
    const latLngs = polygon.getLatLngs()[0] as L.LatLng[];
    
    // Convert to GeoJSON format
    const coordinates = latLngs.map((latLng: L.LatLng) => [latLng.lng, latLng.lat]);
    coordinates.push(coordinates[0]); // Close the polygon

    const geoJsonPolygon = {
      type: "Polygon",
      coordinates: [coordinates]
    };

    onSave(geoJsonPolygon);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] sm:max-h-[700px] h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            {zone ? `Map View - ${zone.zone_name}` : 'Draw Disaster Zone'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col space-y-4 h-full">
          {/* Map Controls */}
          <div className="flex gap-2">
            <Button 
              onClick={startDrawing} 
              disabled={isDrawing}
              variant={isDrawing ? "secondary" : "default"}
            >
              <Edit className="h-4 w-4 mr-2" />
              {isDrawing ? 'Drawing...' : 'Draw Zone'}
            </Button>
            <Button onClick={clearDrawing} variant="outline">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
            <Button onClick={savePolygon} variant="default">
              <Save className="h-4 w-4 mr-2" />
              Save Zone
            </Button>
          </div>

          {/* Map Container */}
          <div 
            ref={mapRef} 
            className="flex-1 w-full rounded-lg border border-gray-300"
            style={{ 
              minHeight: '400px', 
              height: 'calc(100% - 80px)',
              position: 'relative',
              zIndex: 1
            }}
          />

          {/* Instructions */}
          <div className="text-sm text-muted-foreground">
            <p><strong>Instructions:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Click "Draw Zone" to start drawing the disaster zone boundary</li>
              <li>Click on the map to add points to your polygon</li>
              <li>Right-click or double-click to finish drawing</li>
              <li>Click "Save Zone" to save the boundary</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DisasterZoneMapDialog;
