import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { toast } from "@/hooks/use-toast";
import { Plus, Users, Edit, Trash2, Phone, MapPin, Save, X } from "lucide-react";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface EvacuationCenter {
  id: string;
  name: string;
  address: string;
  capacity: number;
  current_occupancy: number;
  status: 'available' | 'full' | 'closed' | 'maintenance';
  contact_person?: string;
  contact_phone?: string;
  facilities?: string[];
  notes?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

interface CenterFormData {
  name: string;
  address: string;
  capacity: number;
  contact_person?: string;
  contact_phone?: string;
  facilities?: string;
  notes?: string;
}

const EvacuationCentersManager = () => {
  const { userProfile } = useAuth();
  const [centers, setCenters] = useState<EvacuationCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCenter, setSelectedCenter] = useState<EvacuationCenter | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const tempMarkerRef = useRef<L.Marker | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);

  const form = useForm<CenterFormData>({
    defaultValues: {
      name: "",
      address: "",
      capacity: 0,
      contact_person: "",
      contact_phone: "",
      facilities: "",
      notes: "",
    },
  });

  // Default location (Philippines center)
  const defaultLocation = { lat: 12.8797, lng: 121.7740 };

  useEffect(() => {
    if (userProfile?.brgyid) {
      fetchCenters();
    }
  }, [userProfile?.brgyid]);

  // Initialize map only once
  useEffect(() => {
    if (!mapRef.current || mapInitialized) return;

    try {
      const map = L.map(mapRef.current, {
        center: [defaultLocation.lat, defaultLocation.lng],
        zoom: 6,
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        dragging: true,
        touchZoom: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      const markers = new L.LayerGroup();
      map.addLayer(markers);

      mapInstanceRef.current = map;
      markersRef.current = markers;
      setMapInitialized(true);

      // Add click event listener to map for placing markers
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (isAddingNew || isEditing) {
          handleMapClick(e.latlng);
        }
      });

      console.log('Map initialized successfully');
      
    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current = null;
        tempMarkerRef.current = null;
        setMapInitialized(false);
      }
    };
  }, [mapRef.current]);

  // Update centers on map when centers change
  useEffect(() => {
    if (mapInitialized && centers.length > 0) {
      loadCentersOnMap(centers);
    }
  }, [centers, mapInitialized]);

  const handleMapClick = (latlng: L.LatLng) => {
    if (!isAddingNew && !isEditing) return;
    if (!mapInstanceRef.current || !markersRef.current) return;

    // Remove existing temp marker
    if (tempMarkerRef.current) {
      markersRef.current.removeLayer(tempMarkerRef.current);
    }

    // Add new temp marker
    const marker = L.marker([latlng.lat, latlng.lng]);
    markersRef.current.addLayer(marker);
    tempMarkerRef.current = marker;

    console.log('Marker placed at:', latlng);
  };

  const fetchCenters = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('evacuation_centers')
        .select('*')
        .eq('brgyid', userProfile?.brgyid)
        .order('name', { ascending: true });

      if (error) throw error;
      setCenters(data || []);
      
    } catch (error) {
      console.error('Error fetching evacuation centers:', error);
      toast({
        title: "Error",
        description: "Failed to load evacuation centers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCentersOnMap = (centersToLoad: EvacuationCenter[]) => {
    if (!mapInstanceRef.current || !markersRef.current) return;

    const markers = markersRef.current;
    markers.clearLayers();

    centersToLoad.forEach(center => {
      if (center.latitude && center.longitude) {
        const marker = L.marker([center.latitude, center.longitude]);
        marker.bindPopup(`
          <strong>${center.name}</strong><br>
          Capacity: ${center.capacity}<br>
          Status: ${center.status}<br>
          Address: ${center.address}
        `);
        markers.addLayer(marker);
      }
    });

    // Fit map to show all markers if any exist
    if (centersToLoad.some(c => c.latitude && c.longitude)) {
      const group = new L.featureGroup(markersRef.current.getLayers());
      mapInstanceRef.current.fitBounds(group.getBounds(), { padding: [20, 20] });
    }
  };

  const focusOnCenter = (center: EvacuationCenter) => {
    if (!mapInstanceRef.current || !center.latitude || !center.longitude) return;

    mapInstanceRef.current.setView([center.latitude, center.longitude], 16);
  };

  const onSubmit = async (data: CenterFormData) => {
    if (!userProfile?.brgyid) return;

    let latitude = null;
    let longitude = null;

    // Get coordinates from temp marker if exists
    if (tempMarkerRef.current) {
      const latlng = tempMarkerRef.current.getLatLng();
      latitude = latlng.lat;
      longitude = latlng.lng;
    }

    try {
      const facilitiesArray = data.facilities 
        ? data.facilities.split(',').map(f => f.trim()).filter(f => f.length > 0)
        : [];

      if (isEditing && selectedCenter) {
        const { error } = await supabase
          .from('evacuation_centers')
          .update({
            name: data.name,
            address: data.address,
            capacity: data.capacity,
            contact_person: data.contact_person || null,
            contact_phone: data.contact_phone || null,
            facilities: facilitiesArray,
            notes: data.notes || null,
            latitude,
            longitude,
          })
          .eq('id', selectedCenter.id);

        if (error) throw error;
        toast({ title: "Success", description: "Evacuation center updated successfully" });
      } else {
        const { error } = await supabase
          .from('evacuation_centers')
          .insert({
            name: data.name,
            address: data.address,
            capacity: data.capacity,
            contact_person: data.contact_person || null,
            contact_phone: data.contact_phone || null,
            facilities: facilitiesArray,
            notes: data.notes || null,
            latitude,
            longitude,
            brgyid: userProfile.brgyid,
          });

        if (error) throw error;
        toast({ title: "Success", description: "Evacuation center added successfully" });
      }

      cancelAddEdit();
      fetchCenters();
    } catch (error) {
      console.error('Error saving evacuation center:', error);
      toast({
        title: "Error",
        description: "Failed to save evacuation center",
        variant: "destructive",
      });
    }
  };

  const updateCenterStatus = async (id: string, status: 'available' | 'full' | 'closed' | 'maintenance') => {
    try {
      const { error } = await supabase
        .from('evacuation_centers')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Center status updated" });
      fetchCenters();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update center status",
        variant: "destructive",
      });
    }
  };

  const deleteCenter = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this evacuation center?')) return;

    try {
      const { error } = await supabase
        .from('evacuation_centers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Evacuation center deleted successfully" });
      setSelectedCenter(null);
      fetchCenters();
    } catch (error) {
      console.error('Error deleting evacuation center:', error);
      toast({
        title: "Error",
        description: "Failed to delete evacuation center",
        variant: "destructive",
      });
    }
  };

  const startAddNew = () => {
    setIsAddingNew(true);
    setIsEditing(false);
    setSelectedCenter(null);
    form.reset();
  };

  const startEdit = (center: EvacuationCenter) => {
    setIsEditing(true);
    setIsAddingNew(false);
    setSelectedCenter(center);
    form.reset({
      name: center.name,
      address: center.address,
      capacity: center.capacity,
      contact_person: center.contact_person || "",
      contact_phone: center.contact_phone || "",
      facilities: center.facilities?.join(', ') || "",
      notes: center.notes || "",
    });
    focusOnCenter(center);
  };

  const cancelAddEdit = () => {
    setIsAddingNew(false);
    setIsEditing(false);
    setSelectedCenter(null);
    form.reset();
    
    if (tempMarkerRef.current && markersRef.current) {
      markersRef.current.removeLayer(tempMarkerRef.current);
      tempMarkerRef.current = null;
    }
    
    fetchCenters(); // Reload centers on map
  };

  const handleCenterClick = (center: EvacuationCenter) => {
    if (isAddingNew || isEditing) return;
    setSelectedCenter(center);
    focusOnCenter(center);
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-200px)] overflow-hidden">
      {/* Left Panel - Centers List or Form */}
      <aside className="w-full md:w-1/3 lg:w-1/4 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">
              {isAddingNew ? 'Add New Center' : isEditing ? 'Edit Center' : `Evacuation Centers (${centers.length})`}
            </h3>
          </div>
          {!isAddingNew && !isEditing && (
            <Button onClick={startAddNew} size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Center
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
                    name="name"
                    rules={{ required: "Center name is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Center Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Barangay Gymnasium" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    rules={{ required: "Address is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Full address of the center" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="capacity"
                    rules={{ 
                      required: "Capacity is required",
                      min: { value: 1, message: "Capacity must be at least 1" }
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacity (Number of People)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="e.g., 100" 
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contact_person"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Name of responsible person" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contact_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="facilities"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facilities (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Kitchen, Toilets, First Aid (comma-separated)" 
                            {...field} 
                          />
                        </FormControl>
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
                            placeholder="Additional information about this center"
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
                <p className="font-medium mb-1">Location Instructions:</p>
                <p>Click on the map to place a marker at the evacuation center location.</p>
              </div>
            </div>
          ) : (
            // Centers List Panel
            <div className="overflow-y-auto h-full">
              {centers.length > 0 ? (
                centers.map((center) => (
                  <div 
                    key={center.id} 
                    className={`p-4 border-b cursor-pointer hover:bg-gray-100 transition-colors ${
                      selectedCenter?.id === center.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => handleCenterClick(center)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getStatusIcon(center.status)}</span>
                        <Badge variant={getStatusColor(center.status) as any}>
                          {center.status}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Select 
                          value={center.status} 
                          onValueChange={(value: 'available' | 'full' | 'closed' | 'maintenance') => updateCenterStatus(center.id, value)}
                        >
                          <SelectTrigger className="w-auto h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="full">Full</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(center);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCenter(center.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <h4 className="font-medium text-sm mb-1">{center.name}</h4>
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {center.address}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Capacity: {center.current_occupancy || 0} / {center.capacity}
                      </span>
                      {center.contact_person && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{center.contact_person}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Evacuation Centers</h3>
                  <p className="text-muted-foreground mb-4">
                    Start by adding evacuation centers for your barangay.
                  </p>
                  <Button onClick={startAddNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Center
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
            className="w-full h-full rounded-lg border border-border bg-gray-100"
            style={{ minHeight: '400px' }}
          />
          
          {/* Instructions overlay */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg text-center text-sm text-gray-700 z-[1000]">
            {isAddingNew || isEditing ? (
              <p>Click on the map to place the evacuation center location</p>
            ) : selectedCenter ? (
              <p>Viewing: <strong>{selectedCenter.name}</strong></p>
            ) : (
              <p>Select a center from the list or click "Add Center" to start</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default EvacuationCentersManager;
