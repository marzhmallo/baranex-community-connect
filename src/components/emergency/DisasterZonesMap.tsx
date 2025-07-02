
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Save, Edit, Trash2 } from 'lucide-react';
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

interface DisasterZonesMapProps {
  zones: DisasterZone[];
  onZoneUpdate: (zoneId: string, coords: any) => void;
  onZoneDelete: (zoneId: string) => void;
}

const DisasterZonesMap: React.FC<DisasterZonesMapProps> = ({ zones, onZoneUpdate, onZoneDelete }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [drawnLayers, setDrawnLayers] = useState<Map<string, L.Polygon>>(new Map());
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<L.Polygon | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  // Default location (Philippines center)
  const defaultLocation = { lat: 12.8797, lng: 121.7740 };

  // Initialize map only once
  useEffect(() => {
    if (!mapRef.current || mapInitialized) return;

    try {
      // Create the map
      const map = L.map(mapRef.current, {
        center: [defaultLocation.lat, defaultLocation.lng],
        zoom: 6,
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: false, // Disable to prevent interference with drawing
        boxZoom: true,
        keyboard: true,
        dragging: true,
        touchZoom: true
      });

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
      setMapInitialized(true);

      console.log('Disaster zones map initialized successfully');
      
    } catch (error) {
      console.error('Error initializing disaster zones map:', error);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        setMapInitialized(false);
      }
    };
  }, [mapRef.current]);

  // Load existing zones when map is ready
  useEffect(() => {
    if (!mapInstanceRef.current || !mapInitialized || zones.length === 0) return;

    // Clear existing layers
    drawnLayers.forEach(layer => {
      mapInstanceRef.current?.removeLayer(layer);
    });
    setDrawnLayers(new Map());

    // Add zones to map
    const newLayers = new Map<string, L.Polygon>();
    
    zones.forEach(zone => {
      if (zone.polygon_coords && zone.polygon_coords.coordinates) {
        try {
          const coordinates = zone.polygon_coords.coordinates[0]; // Get outer ring
          const latLngs = coordinates.map((coord: number[]) => [coord[1], coord[0]]); // Convert [lng, lat] to [lat, lng]
          
          const polygon = L.polygon(latLngs, {
            color: getZoneColor(zone.zone_type, zone.risk_level),
            fillColor: getZoneColor(zone.zone_type, zone.risk_level),
            fillOpacity: 0.3,
            weight: 2
          }).addTo(mapInstanceRef.current!);

          // Add popup with zone info
          polygon.bindPopup(`
            <div>
              <h3 class="font-semibold">${zone.zone_name}</h3>
              <p class="text-sm text-gray-600">${zone.zone_type} - ${zone.risk_level} risk</p>
              ${zone.notes ? `<p class="text-sm mt-1">${zone.notes}</p>` : ''}
            </div>
          `);

          // Add click handler for selection
          polygon.on('click', () => {
            setSelectedZone(zone.id);
            // Highlight selected zone
            polygon.setStyle({ weight: 4, color: '#000' });
            // Reset other polygons
            newLayers.forEach((layer, id) => {
              if (id !== zone.id) {
                layer.setStyle({ 
                  weight: 2, 
                  color: getZoneColor(zones.find(z => z.id === id)?.zone_type || 'other', zones.find(z => z.id === id)?.risk_level || 'medium')
                });
              }
            });
          });

          newLayers.set(zone.id, polygon);
        } catch (error) {
          console.error('Error loading zone:', zone.zone_name, error);
        }
      }
    });

    setDrawnLayers(newLayers);
  }, [zones, mapInitialized]);

  const getZoneColor = (type: string, riskLevel: string) => {
    const baseColors = {
      flood: '#3b82f6',     // blue
      fire: '#ef4444',      // red
      landslide: '#a855f7', // purple
      earthquake: '#f59e0b', // amber
      typhoon: '#10b981',   // emerald
      other: '#6b7280'      // gray
    };

    const intensity = riskLevel === 'high' ? 1 : riskLevel === 'medium' ? 0.8 : 0.6;
    return baseColors[type as keyof typeof baseColors] || baseColors.other;
  };

  const startDrawing = () => {
    if (!mapInstanceRef.current) return;
    
    setIsDrawing(true);
    const map = mapInstanceRef.current;
    
    // Clear any existing drawing
    if (currentDrawing) {
      map.removeLayer(currentDrawing);
    }

    let isDrawingActive = false;
    let polygon: L.Polygon | null = null;
    let points: L.LatLng[] = [];

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!isDrawingActive) {
        // Start drawing
        isDrawingActive = true;
        points = [e.latlng];
        
        polygon = L.polygon([e.latlng], {
          color: '#ff0000',
          fillColor: '#ff0000',
          fillOpacity: 0.2,
          weight: 2
        }).addTo(map);
        
        setCurrentDrawing(polygon);
      } else {
        // Add point to polygon
        points.push(e.latlng);
        polygon?.setLatLngs(points);
      }
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && points.length >= 3) {
        // Finish drawing
        map.off('click', handleMapClick);
        document.removeEventListener('keypress', handleKeyPress);
        setIsDrawing(false);
        
        // You can emit an event here to handle the completed polygon
        console.log('Polygon completed:', points);
      } else if (e.key === 'Escape') {
        // Cancel drawing
        if (polygon) {
          map.removeLayer(polygon);
        }
        map.off('click', handleMapClick);
        document.removeEventListener('keypress', handleKeyPress);
        setIsDrawing(false);
        setCurrentDrawing(null);
      }
    };

    map.on('click', handleMapClick);
    document.addEventListener('keypress', handleKeyPress);
  };

  const deleteSelectedZone = () => {
    if (selectedZone) {
      onZoneDelete(selectedZone);
      setSelectedZone(null);
    }
  };

  const editSelectedZone = () => {
    if (!selectedZone) return;
    
    const layer = drawnLayers.get(selectedZone);
    if (layer) {
      // Convert polygon to editable format
      const latLngs = layer.getLatLngs()[0] as L.LatLng[];
      const coords = latLngs.map(ll => [ll.lng, ll.lat]);
      coords.push(coords[0]); // Close the polygon
      
      const geoJsonCoords = {
        type: "Polygon",
        coordinates: [coords]
      };
      
      onZoneUpdate(selectedZone, geoJsonCoords);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Disaster Risk Zones Map
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              onClick={startDrawing} 
              disabled={isDrawing}
              size="sm"
              variant={isDrawing ? "secondary" : "default"}
            >
              {isDrawing ? 'Click to draw, Enter to finish, Esc to cancel' : 'Draw New Zone'}
            </Button>
            {selectedZone && (
              <>
                <Button 
                  onClick={editSelectedZone} 
                  size="sm"
                  variant="outline"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  onClick={deleteSelectedZone} 
                  size="sm"
                  variant="destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {isDrawing 
            ? "Click points on the map to draw a zone boundary. Press Enter when finished, or Esc to cancel."
            : "View and manage disaster risk zones. Click on a zone to select it."
          }
        </p>
      </CardHeader>
      <CardContent>
        <div 
          ref={mapRef} 
          className="w-full h-[500px] rounded-lg border border-border bg-gray-100"
          style={{ minHeight: '500px' }}
        />
        {zones.length > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {zones.map((zone) => (
              <div 
                key={zone.id}
                className={`p-2 rounded border text-sm cursor-pointer transition-colors ${
                  selectedZone === zone.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:bg-muted'
                }`}
                onClick={() => setSelectedZone(zone.id)}
              >
                <div className="font-medium">{zone.zone_name}</div>
                <div className="text-xs text-muted-foreground">
                  {zone.zone_type} - {zone.risk_level} risk
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DisasterZonesMap;
