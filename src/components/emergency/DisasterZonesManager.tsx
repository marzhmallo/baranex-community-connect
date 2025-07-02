import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { toast } from "@/hooks/use-toast";
import { Plus, MapPin, Edit, Trash2, AlertTriangle, Save, X } from "lucide-react";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';

// Fix for default markers
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
  created_at: string;
}

interface ZoneFormData {
  zone_name: string;
  zone_type: 'flood' | 'fire' | 'landslide' | 'earthquake' | 'typhoon' | 'other' | '';
  notes?: string;
  risk_level: string;
}

const DisasterZonesManager = () => {
  const { userProfile } = useAuth();
  const [zones, setZones] = useState<DisasterZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<DisasterZone | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const currentPolygonRef = useRef<L.Polygon | null>(null);
  const polygonDrawerRef = useRef<L.Draw.Polygon | null>(null);

  const form = useForm<ZoneFormData>({
    defaultValues: {
      zone_name: "",
      zone_type: '',
      notes: "",
      risk_level: "medium",
    },
  });

  // Fetch zones data
  useEffect(() => {
    if (userProfile?.brgyid) {
      fetchZones();
    }
  }, [userProfile?.brgyid]);

  // Initialize map when component mounts and data is ready
  useEffect(() => {
    if (!mapReady && mapRef.current && !mapInstanceRef.current) {
      const timer = setTimeout(() => {
        initializeMap();
      }, 100);
      
      return () => clearTimeout(timer);
    }
    
    return () => {
      // Cleanup map on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        drawnItemsRef.current = null;
        setMapReady(false);
      }
    };
  }, [mapReady]);

  // Load zones on map when zones data changes and map is ready
  useEffect(() => {
    if (mapReady && zones.length > 0 && !isAddingNew && !isEditing) {
      loadZonesOnMap(zones);
    }
  }, [zones, mapReady, isAddingNew, isEditing]);

  const initializeMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      console.log('Initializing map...');
      
      const map = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: true
      }).setView([14.5995, 121.0244], 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);

      mapInstanceRef.current = map;
      drawnItemsRef.current = drawnItems;

      // Handle polygon drawing
      map.on(L.Draw.Event.CREATED, (e: any) => {
        const layer = e.layer;
        if (currentPolygonRef.current && drawnItems.hasLayer(currentPolygonRef.current)) {
          drawnItems.removeLayer(currentPolygonRef.current);
        }
        drawnItems.addLayer(layer);
        currentPolygonRef.current = layer;
      });

      // Ensure map renders properly
      setTimeout(() => {
        map.invalidateSize();
        setMapReady(true);
        console.log('Map initialized successfully');
      }, 200);

    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  const enableDrawingMode = () => {
    if (!mapInstanceRef.current || !drawnItemsRef.current) {
      console.error('Map not ready for drawing');
      return;
    }

    const map = mapInstanceRef.current;
    
    try {
      // Cast the map to any to avoid TypeScript issues with leaflet-draw
      polygonDrawerRef.current = new L.Draw.Polygon(map as any, {
        allowIntersection: false,
        drawError: {
          color: '#b00b00',
          timeout: 1000
        },
        shapeOptions: {
          color: '#97009c',
          fillOpacity: 0.3
        }
      });
      
      polygonDrawerRef.current.enable();
    } catch (error) {
      console.error('Error enabling drawing mode:', error);
    }
  };

  const disableDrawingMode = () => {
    if (polygonDrawerRef.current) {
      try {
        polygonDrawerRef.current.disable();
        polygonDrawerRef.current = null;
      } catch (error) {
        console.error('Error disabling drawing mode:', error);
      }
    }
  };

  const fetchZones = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('disaster_zones')
        .select('*')
        .eq('brgyid', userProfile?.brgyid)
        .order('zone_name', { ascending: true });

      if (error) throw error;
      setZones(data || []);
    } catch (error) {
      console.error('Error fetching disaster zones:', error);
      toast({
        title: "Error",
        description: "Failed to load disaster zones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadZonesOnMap = (zonesToLoad: DisasterZone[]) => {
    if (!mapInstanceRef.current || !drawnItemsRef.current) return;

    const drawnItems = drawnItemsRef.current;
    drawnItems.clearLayers();

    zonesToLoad.forEach(zone => {
      if (zone.polygon_coords && zone.polygon_coords.coordinates) {
        try {
          const coordinates = zone.polygon_coords.coordinates[0];
          const latlngs = coordinates.map((coord: number[]) => [coord[1], coord[0]]);
          
          const polygon = L.polygon(latlngs, {
            color: getRiskColor(zone.risk_level),
            fillColor: getRiskColor(zone.risk_level),
            fillOpacity: 0.3,
            weight: 2
          });
          
          polygon.bindPopup(`
            <div class="p-2">
              <strong>${zone.zone_name}</strong><br>
              <span class="text-sm">Type: ${zone.zone_type}</span><br>
              <span class="text-sm">Risk: ${zone.risk_level}</span>
              ${zone.notes ? `<br><span class="text-xs text-gray-600">${zone.notes}</span>` : ''}
            </div>
          `);
          
          drawnItems.addLayer(polygon);
        } catch (error) {
          console.error('Error loading zone polygon:', error);
        }
      }
    });
  };

  const focusOnZone = (zone: DisasterZone) => {
    if (!mapInstanceRef.current || !zone.polygon_coords) return;

    try {
      const coordinates = zone.polygon_coords.coordinates[0];
      const latlngs = coordinates.map((coord: number[]) => [coord[1], coord[0]]);
      const bounds = L.latLngBounds(latlngs);
      mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] });
    } catch (error) {
      console.error('Error focusing on zone:', error);
    }
  };

  const onSubmit = async (data: ZoneFormData) => {
    if (!userProfile?.id || !userProfile?.brgyid || !data.zone_type) return;
    if (!currentPolygonRef.current) {
      toast({
        title: "Error",
        description: "Please draw a zone on the map",
        variant: "destructive",
      });
      return;
    }

    try {
      const polygon = currentPolygonRef.current;
      const latlngs = polygon.getLatLngs()[0] as L.LatLng[];
      const coordinates = latlngs.map(latlng => [latlng.lng, latlng.lat]);
      coordinates.push(coordinates[0]); // Close the polygon
      
      const polygonGeoJSON = {
        type: "Polygon",
        coordinates: [coordinates]
      };

      if (isEditing && selectedZone) {
        const { error } = await supabase
          .from('disaster_zones')
          .update({
            zone_name: data.zone_name,
            zone_type: data.zone_type as 'flood' | 'fire' | 'landslide' | 'earthquake' | 'typhoon' | 'other',
            notes: data.notes || null,
            risk_level: data.risk_level,
            polygon_coords: polygonGeoJSON,
          })
          .eq('id', selectedZone.id);

        if (error) throw error;
        toast({ title: "Success", description: "Disaster zone updated successfully" });
      } else {
        const { error } = await supabase
          .from('disaster_zones')
          .insert({
            zone_name: data.zone_name,
            zone_type: data.zone_type as 'flood' | 'fire' | 'landslide' | 'earthquake' | 'typhoon' | 'other',
            polygon_coords: polygonGeoJSON,
            notes: data.notes || null,
            risk_level: data.risk_level,
            brgyid: userProfile.brgyid,
            created_by: userProfile.id,
          });

        if (error) throw error;
        toast({ title: "Success", description: "Disaster zone added successfully" });
      }

      cancelAddEdit();
      fetchZones();
    } catch (error) {
      console.error('Error saving disaster zone:', error);
      toast({
        title: "Error",
        description: "Failed to save disaster zone",
        variant: "destructive",
      });
    }
  };

  const deleteZone = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this disaster zone?')) return;

    try {
      const { error } = await supabase
        .from('disaster_zones')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Disaster zone deleted successfully" });
      setSelectedZone(null);
      fetchZones();
    } catch (error) {
      console.error('Error deleting disaster zone:', error);
      toast({
        title: "Error",
        description: "Failed to delete disaster zone",
        variant: "destructive",
      });
    }
  };

  const startAddNew = () => {
    setIsAddingNew(true);
    setIsEditing(false);
    setSelectedZone(null);
    form.reset();
    enableDrawingMode();
  };

  const startEdit = (zone: DisasterZone) => {
    setIsEditing(true);
    setIsAddingNew(false);
    setSelectedZone(zone);
    form.reset({
      zone_name: zone.zone_name,
      zone_type: zone.zone_type,
      notes: zone.notes || "",
      risk_level: zone.risk_level,
    });
    enableDrawingMode();
    focusOnZone(zone);
  };

  const cancelAddEdit = () => {
    setIsAddingNew(false);
    setIsEditing(false);
    setSelectedZone(null);
    form.reset();
    disableDrawingMode();
    
    if (currentPolygonRef.current && drawnItemsRef.current) {
      drawnItemsRef.current.removeLayer(currentPolygonRef.current);
      currentPolygonRef.current = null;
    }
    
    // Reload zones on map
    if (zones.length > 0) {
      loadZonesOnMap(zones);
    }
  };

  const handleZoneClick = (zone: DisasterZone) => {
    if (isAddingNew || isEditing) return;
    setSelectedZone(zone);
    focusOnZone(zone);
  };

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
      case 'low': return '#22c55e';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case 'low': return 'default';
      case 'medium': return 'secondary';
      case 'high': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-200px)] overflow-hidden">
      {/* Left Panel - Zone List or Form */}
      <aside className="w-full md:w-1/3 lg:w-1/4 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">
              {isAddingNew ? 'Add New Zone' : isEditing ? 'Edit Zone' : `Disaster Zones (${zones.length})`}
            </h3>
          </div>
          {!isAddingNew && !isEditing && (
            <Button onClick={startAddNew} size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Zone
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-hidden">
          {isAddingNew || isEditing ? (
            // Form Panel
            <div className="p-4 space-y-4 overflow-y-auto h-full">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="zone_name"
                    rules={{ required: "Zone name is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zone Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Creek Side Area" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="zone_type"
                    rules={{ required: "Zone type is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Disaster Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select disaster type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="flood">🌊 Flood Zone</SelectItem>
                            <SelectItem value="fire">🔥 Fire Hazard</SelectItem>
                            <SelectItem value="landslide">⛰️ Landslide Risk</SelectItem>
                            <SelectItem value="earthquake">🌍 Earthquake Fault</SelectItem>
                            <SelectItem value="typhoon">🌀 Typhoon Path</SelectItem>
                            <SelectItem value="other">⚠️ Other Hazard</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="risk_level"
                    rules={{ required: "Risk level is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Risk Level</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low Risk</SelectItem>
                            <SelectItem value="medium">Medium Risk</SelectItem>
                            <SelectItem value="high">High Risk</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Additional information about this risk zone"
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1">
                      <Save className="h-4 w-4 mr-2" />
                      {isEditing ? 'Update' : 'Save'}
                    </Button>
                    <Button type="button" variant="outline" onClick={cancelAddEdit}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
              
              <div className="text-sm text-muted-foreground mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="font-medium mb-1">Drawing Instructions:</p>
                <p>Click on the map to start drawing points for the disaster zone boundary. Click the first point again to complete the polygon.</p>
              </div>
            </div>
          ) : (
            // Zone List Panel
            <div className="overflow-y-auto h-full">
              {zones.length > 0 ? (
                zones.map((zone) => (
                  <div 
                    key={zone.id} 
                    className={`p-4 border-b cursor-pointer hover:bg-gray-100 transition-colors ${
                      selectedZone?.id === zone.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => handleZoneClick(zone)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getTypeIcon(zone.zone_type)}</span>
                        <Badge variant={getRiskBadgeVariant(zone.risk_level) as any}>
                          {zone.risk_level}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(zone);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteZone(zone.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <h4 className="font-medium text-sm mb-1">{zone.zone_name}</h4>
                    <p className="text-xs text-muted-foreground capitalize mb-2">
                      {zone.zone_type.replace('_', ' ')} zone
                    </p>
                    {zone.notes && (
                      <p className="text-xs text-muted-foreground">{zone.notes}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Risk Zones Mapped</h3>
                  <p className="text-muted-foreground mb-4">
                    Start by identifying and mapping disaster-prone areas in your barangay.
                  </p>
                  <Button onClick={startAddNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Zone
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Right Panel - Map */}
      <main className="flex-1 relative">
        <div className="h-full bg-gray-100">
          <div 
            ref={mapRef} 
            className="w-full h-full"
            style={{ minHeight: '400px', background: '#e5e7eb' }}
          />
          
          {/* Instructions overlay */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg text-center text-sm text-gray-700 z-[1000]">
            {!mapReady ? (
              <p>Loading map...</p>
            ) : isAddingNew || isEditing ? (
              <p>Drawing mode active - Click to draw zone boundaries</p>
            ) : selectedZone ? (
              <p>Viewing: <strong>{selectedZone.zone_name}</strong></p>
            ) : (
              <p>Select a zone from the list or click "Add Zone" to start</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DisasterZonesManager;
