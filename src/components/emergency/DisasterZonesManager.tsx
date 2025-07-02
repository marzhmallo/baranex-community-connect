
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
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const currentPolygonRef = useRef<L.Polygon | null>(null);
  const drawControlRef = useRef<L.Control.Draw | null>(null);

  const form = useForm<ZoneFormData>({
    defaultValues: {
      zone_name: "",
      zone_type: '',
      notes: "",
      risk_level: "medium",
    },
  });

  useEffect(() => {
    if (userProfile?.brgyid) {
      fetchZones();
    }
  }, [userProfile?.brgyid]);

  useEffect(() => {
    initializeMap();
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([14.5995, 121.0244], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    mapInstanceRef.current = map;
    drawnItemsRef.current = drawnItems;

    // Force map resize after a brief delay
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  };

  const enableDrawingMode = () => {
    if (!mapInstanceRef.current || !drawnItemsRef.current) return;

    const map = mapInstanceRef.current;
    const drawnItems = drawnItemsRef.current;

    // Clear existing draw controls
    if (drawControlRef.current) {
      map.removeControl(drawControlRef.current);
    }

    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: drawnItems,
      },
      draw: {
        polygon: true,
        polyline: false,
        rectangle: false,
        circle: false,
        marker: false,
        circlemarker: false,
      }
    });

    map.addControl(drawControl);
    drawControlRef.current = drawControl;

    map.on(L.Draw.Event.CREATED, (e: any) => {
      const layer = e.layer;
      if (currentPolygonRef.current) {
        drawnItems.removeLayer(currentPolygonRef.current);
      }
      drawnItems.addLayer(layer);
      currentPolygonRef.current = layer;
    });
  };

  const disableDrawingMode = () => {
    if (!mapInstanceRef.current || !drawControlRef.current) return;

    mapInstanceRef.current.removeControl(drawControlRef.current);
    drawControlRef.current = null;
    mapInstanceRef.current.off(L.Draw.Event.CREATED);
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
      
      // Load all zones on the map
      if (data && data.length > 0) {
        loadZonesOnMap(data);
      }
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
            fillOpacity: 0.3
          });
          
          polygon.bindPopup(`
            <strong>${zone.zone_name}</strong><br>
            Type: ${zone.zone_type}<br>
            Risk: ${zone.risk_level}
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
    
    fetchZones(); // Reload zones on map
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
    <div className="flex h-[calc(100vh-200px)] gap-4">
      {/* Left Panel - Zone List or Form */}
      <div className="w-80 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {isAddingNew ? 'Add New Zone' : isEditing ? 'Edit Zone' : `Disaster Zones (${zones.length})`}
          </h3>
          {!isAddingNew && !isEditing && (
            <Button onClick={startAddNew} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Zone
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-hidden">
          {isAddingNew || isEditing ? (
            // Form Panel
            <Card className="h-full">
              <CardContent className="p-4 space-y-4">
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
                  <p>Use the polygon tool from the map toolbar to draw the disaster zone boundary. Click to start drawing, then click each point to create the shape.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Zone List Panel
            <div className="space-y-2 overflow-y-auto h-full">
              {zones.length > 0 ? (
                zones.map((zone) => (
                  <Card 
                    key={zone.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedZone?.id === zone.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleZoneClick(zone)}
                  >
                    <CardContent className="p-4">
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
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Risk Zones Mapped</h3>
                    <p className="text-muted-foreground mb-4">
                      Start by identifying and mapping disaster-prone areas in your barangay.
                    </p>
                    <Button onClick={startAddNew}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Zone
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Map */}
      <div className="flex-1 relative">
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Disaster Zone Map
              {selectedZone && (
                <Badge variant="outline" className="ml-2">
                  Viewing: {selectedZone.zone_name}
                </Badge>
              )}
            </CardTitle>
            {(isAddingNew || isEditing) && (
              <CardDescription className="text-sm text-blue-600">
                Drawing mode active - Use the polygon tool to draw zone boundaries
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="p-4 pt-0 h-full">
            <div 
              ref={mapRef} 
              className="w-full h-[calc(100%-60px)] rounded-lg border border-gray-200"
              style={{ minHeight: '400px' }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DisasterZonesManager;
