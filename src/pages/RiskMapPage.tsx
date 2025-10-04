import { useState, useEffect, useRef } from "react";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AddEvacuationCenterModal } from "@/components/emergency/AddEvacuationCenterModal";
import { AddEvacuationRouteModal } from "@/components/emergency/AddEvacuationRouteModal";
import { DisasterZoneDetailsModal } from "@/components/emergency/DisasterZoneDetailsModal";
import { EvacuationCenterDetailsModal } from "@/components/emergency/EvacuationCenterDetailsModal";
import { EvacuationRouteDetailsModal } from "@/components/emergency/EvacuationRouteDetailsModal";
import { EmergencyRequestForm } from "@/components/emergency/EmergencyRequestForm";
import { UserEmergencyRequests } from "@/components/emergency/UserEmergencyRequests";
import { EmergencyTriageFeed } from "@/components/emergency/EmergencyTriageFeed";
import { EmergencyRequestDetailsModal } from "@/components/emergency/EmergencyRequestDetailsModal";
import { EmergencyFeedToggle } from "@/components/emergency/EmergencyFeedToggle";
import { Eye, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

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
  risk_level: 'low' | 'medium' | 'high';
  notes: string | null;
  polygon_coords: [number, number][];
}

interface EvacCenter {
  id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  capacity: number;
  occupancy: number | null;
  status: string | null;
}

interface SafeRoute {
  id: string;
  route_name: string;
  route_coords: [number, number][];
  start_point: { lat: number; lng: number };
  end_point: { lat: number; lng: number };
  distance_km?: number | null;
  estimated_time_minutes?: number | null;
}

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

const RiskMapPage = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [showZones, setShowZones] = useState(true);
  const [showCenters, setShowCenters] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showEmergencyRequests, setShowEmergencyRequests] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showCenterModal, setShowCenterModal] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showEmergencyForm, setShowEmergencyForm] = useState(false);
  const [tempLayer, setTempLayer] = useState<L.Layer | null>(null);
  const [tempCoordinates, setTempCoordinates] = useState<any>(null);
  
  // Detail modal states
  const [showZoneDetails, setShowZoneDetails] = useState(false);
  const [showCenterDetails, setShowCenterDetails] = useState(false);
  const [showRouteDetails, setShowRouteDetails] = useState(false);
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [selectedZone, setSelectedZone] = useState<DisasterZone | null>(null);
  const [selectedCenter, setSelectedCenter] = useState<EvacCenter | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<SafeRoute | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isFeedOpen, setIsFeedOpen] = useState(false);
  
  const { toast } = useToast();
  const { userProfile } = useAuth();
  
  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'staff';
  
  // Layer groups
  const zonesLayerRef = useRef<L.FeatureGroup | null>(null);
  const centersLayerRef = useRef<L.FeatureGroup | null>(null);
  const routesLayerRef = useRef<L.FeatureGroup | null>(null);
  const emergencyRequestsLayerRef = useRef<L.FeatureGroup | null>(null);
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);

  // Database-connected data
  const [disasterZones, setDisasterZones] = useState<DisasterZone[]>([]);
  const [evacCenters, setEvacCenters] = useState<EvacCenter[]>([]);
  const [safeRoutes, setSafeRoutes] = useState<SafeRoute[]>([]);
  const [emergencyRequests, setEmergencyRequests] = useState<EmergencyRequest[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    zoneName: '',
    disasterType: 'flood',
    riskLevel: 'medium' as 'low' | 'medium' | 'high',
    notes: ''
  });

  // Fetch data from Supabase
  const fetchDisasterZones = async () => {
    try {
      const { data, error } = await supabase
        .from('disaster_zones')
        .select('*');
      
      if (error) throw error;
      const transformedData = (data || []).map(zone => ({
        id: zone.id,
        zone_name: zone.zone_name,
        zone_type: zone.zone_type,
        risk_level: zone.risk_level as 'low' | 'medium' | 'high',
        notes: zone.notes,
        polygon_coords: zone.polygon_coords as [number, number][]
      }));
      setDisasterZones(transformedData);
      return transformedData;
    } catch (error) {
      console.error('Error fetching disaster zones:', error);
      toast({ title: "Error fetching disaster zones", variant: "destructive" });
      return [];
    }
  };

  const fetchEvacCenters = async () => {
    try {
      const { data, error } = await supabase
        .from('evacuation_centers')
        .select('*');
      
      if (error) throw error;
      setEvacCenters(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching evacuation centers:', error);
      toast({ title: "Error fetching evacuation centers", variant: "destructive" });
      return [];
    }
  };

  const fetchSafeRoutes = async () => {
    try {
      const { data, error } = await supabase
        .from('evacuation_routes')
        .select('*');
      
      if (error) throw error;
      const transformedData = (data || []).map(route => ({
        id: route.id,
        route_name: route.route_name,
        route_coords: route.route_coords as [number, number][],
        start_point: route.start_point as { lat: number; lng: number },
        end_point: route.end_point as { lat: number; lng: number },
        distance_km: route.distance_km,
        estimated_time_minutes: route.estimated_time_minutes
      }));
      setSafeRoutes(transformedData);
      return transformedData;
    } catch (error) {
      console.error('Error fetching evacuation routes:', error);
      toast({ title: "Error fetching evacuation routes", variant: "destructive" });
      return [];
    }
  };

  const fetchEmergencyRequests = async () => {
    if (!userProfile?.brgyid) return [];
    
    try {
      const { data, error } = await supabase
        .from('emergency_requests' as any)
        .select('*')
        .eq('brgyid', userProfile.brgyid)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setEmergencyRequests((data as any) || []);
      return (data as any) || [];
    } catch (error) {
      console.error('Error fetching emergency requests:', error);
      return [];
    }
  };

  const setupRealtimeSubscription = () => {
    if (!userProfile?.brgyid) return;
    
    const channel = supabase
      .channel('emergency-requests-map')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emergency_requests',
          filter: `brgyid=eq.${userProfile.brgyid}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setEmergencyRequests(prev => [payload.new as any, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setEmergencyRequests(prev =>
              prev.map(req => req.id === (payload.new as any).id ? payload.new as any : req)
            );
          } else if (payload.eventType === 'DELETE') {
            setEmergencyRequests(prev => prev.filter(req => req.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // Load data on component mount
  useEffect(() => {
    fetchDisasterZones();
    fetchEvacCenters();
    fetchSafeRoutes();
    if (userProfile?.brgyid) {
      fetchEmergencyRequests();
      setupRealtimeSubscription();
    }
  }, [userProfile?.brgyid]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const mapInstance = L.map(mapRef.current).setView([12.8797, 121.7740], 6);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(mapInstance);

    // Create layer groups
    const zonesLayer = L.featureGroup().addTo(mapInstance);
    const centersLayer = L.featureGroup().addTo(mapInstance);
    const routesLayer = L.featureGroup().addTo(mapInstance);

    zonesLayerRef.current = zonesLayer;
    centersLayerRef.current = centersLayer;
    routesLayerRef.current = routesLayer;

    // Set up drawing controls
    const drawnItems = new L.FeatureGroup();
    mapInstance.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    const drawControl = new L.Control.Draw({
      edit: { 
        featureGroup: drawnItems,
        remove: true
      },
      draw: {
        polygon: { shapeOptions: { color: 'red' } },
        marker: { icon: createIcon('green') },
        polyline: { shapeOptions: { color: 'blue' } },
        circle: false,
        circlemarker: false,
        rectangle: false
      }
    });

    drawControlRef.current = drawControl;

    mapInstance.on(L.Draw.Event.CREATED, function (e: any) {
      const type = e.layerType;
      const layer = e.layer;
      
      if (type === 'polygon') {
        setTempLayer(layer);
        setShowModal(true);
      } else if (type === 'marker') {
        const coords = layer.getLatLng();
        setTempCoordinates([coords.lat, coords.lng]);
        setTempLayer(layer);
        setShowCenterModal(true);
      } else if (type === 'polyline') {
        const coords = layer.getLatLngs().map((latlng: any) => [latlng.lat, latlng.lng]);
        setTempCoordinates(coords);
        setTempLayer(layer);
        setShowRouteModal(true);
      } else {
        const name = prompt(`Enter a name for the new ${type}:`);
        if (name) {
          layer.bindPopup(`<b>${name}</b>`).openPopup();
          drawnItems.addLayer(layer);
        }
      }
      toggleDrawing(); // Exit drawing mode after one shape
    });

    mapInstance.on(L.Draw.Event.EDITED, async function (e: any) {
      console.log('Layers edited:', e.layers);
      
      try {
        const editedLayers = e.layers;
        let updateCount = 0;
        
        const updatePromises: Promise<void>[] = [];
        
        editedLayers.eachLayer((layer: any) => {
          const dbId = layer.dbId;
          const dbType = layer.dbType;
          
          if (!dbId || !dbType) return;
          
          const updatePromise = (async () => {
            if (dbType === 'disaster_zone') {
              const coordinates = layer.getLatLngs()[0].map((latlng: any) => [latlng.lat, latlng.lng]);
              const { error } = await supabase
                .from('disaster_zones')
                .update({ polygon_coords: coordinates })
                .eq('id', dbId);
              
              if (!error) {
                // Update local state immediately
                setDisasterZones(prev => prev.map(zone => 
                  zone.id === dbId 
                    ? { ...zone, polygon_coords: coordinates }
                    : zone
                ));
                updateCount++;
              }
            } else if (dbType === 'evacuation_center') {
              const coords = layer.getLatLng();
              const { error } = await supabase
                .from('evacuation_centers')
                .update({ latitude: coords.lat, longitude: coords.lng })
                .eq('id', dbId);
              
              if (!error) {
                // Update local state immediately
                setEvacCenters(prev => prev.map(center => 
                  center.id === dbId 
                    ? { ...center, latitude: coords.lat, longitude: coords.lng }
                    : center
                ));
                updateCount++;
              }
            } else if (dbType === 'evacuation_route') {
              const coordinates = layer.getLatLngs().map((latlng: any) => [latlng.lat, latlng.lng]);
              const { error } = await supabase
                .from('evacuation_routes')
                .update({ route_coords: coordinates })
                .eq('id', dbId);
              
              if (!error) {
                // Update local state immediately
                setSafeRoutes(prev => prev.map(route => 
                  route.id === dbId 
                    ? { ...route, route_coords: coordinates }
                    : route
                ));
                updateCount++;
              }
            }
          })();
          
          updatePromises.push(updatePromise);
        });
        
        // Wait for all updates to complete
        await Promise.all(updatePromises);
        
        if (updateCount > 0) {
          toast({ title: `${updateCount} item(s) updated successfully!` });
        }
      } catch (error) {
        console.error('Error updating items:', error);
        toast({ title: "Error updating items", variant: "destructive" });
      }
    });

    mapInstance.on(L.Draw.Event.DELETED, async function (e: any) {
      console.log('Layers deleted:', e.layers);
      
      try {
        const deletedLayers = e.layers;
        let deleteCount = 0;
        
        const deletePromises: Promise<void>[] = [];
        
        deletedLayers.eachLayer((layer: any) => {
          const dbId = layer.dbId;
          const dbType = layer.dbType;
          
          if (!dbId || !dbType) return;
          
          const deletePromise = (async () => {
            let error = null;
            
            if (dbType === 'disaster_zone') {
              const result = await supabase
                .from('disaster_zones')
                .delete()
                .eq('id', dbId);
              error = result.error;
              
              if (!error) {
                // Update local state immediately
                setDisasterZones(prev => prev.filter(zone => zone.id !== dbId));
                deleteCount++;
              }
            } else if (dbType === 'evacuation_center') {
              const result = await supabase
                .from('evacuation_centers')
                .delete()
                .eq('id', dbId);
              error = result.error;
              
              if (!error) {
                // Update local state immediately
                setEvacCenters(prev => prev.filter(center => center.id !== dbId));
                deleteCount++;
              }
            } else if (dbType === 'evacuation_route') {
              const result = await supabase
                .from('evacuation_routes')
                .delete()
                .eq('id', dbId);
              error = result.error;
              
              if (!error) {
                // Update local state immediately
                setSafeRoutes(prev => prev.filter(route => route.id !== dbId));
                deleteCount++;
              }
            }
            
            if (error) {
              console.error('Error deleting item:', error);
            }
          })();
          
          deletePromises.push(deletePromise);
        });
        
        // Wait for all deletions to complete
        await Promise.all(deletePromises);
        
        if (deleteCount > 0) {
          toast({ title: `${deleteCount} item(s) deleted successfully!` });
        }
      } catch (error) {
        console.error('Error deleting items:', error);
        toast({ title: "Error deleting items", variant: "destructive" });
      }
    });

    mapInstanceRef.current = mapInstance;
    setMap(mapInstance);

    // Render initial data
    renderMapData(mapInstance, zonesLayer, centersLayer, routesLayer);

    return () => {
      mapInstance.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  const createIcon = (color: string) => {
    return new L.Icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  };

  const createEmergencyPin = (request: EmergencyRequest) => {
    const statusColors = {
      'Pending': '#EF4444',      // red-500
      'In Progress': '#EAB308',  // yellow-500
      'Responded': '#22C55E'     // green-500
    };
    
    const color = statusColors[request.status as keyof typeof statusColors] || '#EF4444';
    
    const icon = L.divIcon({
      className: 'emergency-request-pin',
      html: `
        <div class="relative">
          <div class="absolute -translate-x-1/2 -translate-y-full">
            <div 
              class="w-10 h-10 rounded-full border-4 border-white shadow-xl flex items-center justify-center animate-pulse" 
              style="background-color: ${color}"
            >
              <span class="text-white font-bold text-lg">!</span>
            </div>
            <div 
              class="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[10px] border-transparent mx-auto"
              style="border-top-color: ${color}"
            ></div>
          </div>
        </div>
      `,
      iconSize: [40, 60],
      iconAnchor: [20, 60]
    });
    
    return icon;
  };

  const renderMapData = (mapInstance: L.Map, zonesLayer: L.FeatureGroup, centersLayer: L.FeatureGroup, routesLayer: L.FeatureGroup) => {
    // Clear existing layers
    zonesLayer.clearLayers();
    centersLayer.clearLayers();
    routesLayer.clearLayers();
    
    // Clear drawnItems for editing
    if (drawnItemsRef.current) {
      drawnItemsRef.current.clearLayers();
    }

    // Only add to drawnItems (single source of truth) with proper layer organization
    disasterZones.forEach(zone => {
      if (zone.polygon_coords) {
        const coords = zone.polygon_coords as [number, number][];
        const polygon = L.polygon(coords, { color: 'red' }).bindPopup(zone.zone_name);
        
        // Store metadata to identify the database record
        (polygon as any).dbId = zone.id;
        (polygon as any).dbType = 'disaster_zone';
        
        // Add to both drawnItems for editing AND zonesLayer for visibility control
        if (showZones) {
          zonesLayer.addLayer(polygon);
        }
        if (drawnItemsRef.current) {
          drawnItemsRef.current.addLayer(polygon);
        }
      }
    });

    // Render evacuation centers
    evacCenters.forEach(center => {
      if (center.latitude && center.longitude) {
        const coords: [number, number] = [center.latitude, center.longitude];
        const marker = L.marker(coords, { icon: createIcon('green') }).bindPopup(center.name);
        
        // Store metadata to identify the database record  
        (marker as any).dbId = center.id;
        (marker as any).dbType = 'evacuation_center';
        
        // Add to both drawnItems for editing AND centersLayer for visibility control
        if (showCenters) {
          centersLayer.addLayer(marker);
        }
        if (drawnItemsRef.current) {
          drawnItemsRef.current.addLayer(marker);
        }
      }
    });

    // Render safe routes
    safeRoutes.forEach(route => {
      if (route.route_coords) {
        const coords = route.route_coords as [number, number][];
        const polyline = L.polyline(coords, { color: 'blue' }).bindPopup(route.route_name);
        
        // Store metadata to identify the database record
        (polyline as any).dbId = route.id;
        (polyline as any).dbType = 'evacuation_route';
        
        // Add to both drawnItems for editing AND routesLayer for visibility control
        if (showRoutes) {
          routesLayer.addLayer(polyline);
        }
        if (drawnItemsRef.current) {
          drawnItemsRef.current.addLayer(polyline);
        }
      }
    });
  };

  // Re-render map data when data changes
  useEffect(() => {
    if (map && zonesLayerRef.current && centersLayerRef.current && routesLayerRef.current) {
      renderMapData(map, zonesLayerRef.current, centersLayerRef.current, routesLayerRef.current);
    }
  }, [disasterZones, evacCenters, safeRoutes, map]);

  // Render emergency request pins
  useEffect(() => {
    if (!map || !emergencyRequests.length) return;
    
    if (!emergencyRequestsLayerRef.current) {
      emergencyRequestsLayerRef.current = L.featureGroup().addTo(map);
    }
    
    const layer = emergencyRequestsLayerRef.current;
    layer.clearLayers();
    
    if (showEmergencyRequests) {
      emergencyRequests.forEach(request => {
        if (request.latitude && request.longitude) {
          const marker = L.marker(
            [request.latitude, request.longitude],
            { icon: createEmergencyPin(request) }
          );
          
          const statusEmoji = {
            'Pending': '🔴',
            'In Progress': '🟡',
            'Responded': '🟢'
          };
          
          const formatTimeAgo = (date: string) => {
            const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
            if (seconds < 60) return `${seconds}s ago`;
            const minutes = Math.floor(seconds / 60);
            if (minutes < 60) return `${minutes}m ago`;
            const hours = Math.floor(minutes / 60);
            if (hours < 24) return `${hours}h ago`;
            return `${Math.floor(hours / 24)}d ago`;
          };
          
          marker.bindPopup(`
            <div class="p-2 min-w-[200px]">
              <h3 class="font-bold text-lg mb-2">${request.request_type}</h3>
              <p class="text-sm text-gray-600 mb-1">
                Status: <span class="font-semibold">${statusEmoji[request.status as keyof typeof statusEmoji]} ${request.status}</span>
              </p>
              <p class="text-sm text-gray-600 mb-2">Time: ${formatTimeAgo(request.created_at)}</p>
              ${request.details ? `<p class="text-sm mb-2">${request.details}</p>` : ''}
              <button 
                onclick="document.dispatchEvent(new CustomEvent('openRequestDetails', { detail: '${request.id}' }))"
                class="w-full bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700 text-sm"
              >
                View Details
              </button>
            </div>
          `);
          
          layer.addLayer(marker);
        }
      });
    }
  }, [map, emergencyRequests, showEmergencyRequests]);

  // Listen for custom event to open request details
  useEffect(() => {
    const handleOpenRequestDetails = (e: any) => {
      setSelectedRequestId(e.detail);
      setShowRequestDetails(true);
    };
    
    document.addEventListener('openRequestDetails' as any, handleOpenRequestDetails);
    return () => {
      document.removeEventListener('openRequestDetails' as any, handleOpenRequestDetails);
    };
  }, []);

  const toggleDrawing = () => {
    if (!map || !drawControlRef.current) return;

    if (isDrawing) {
      map.removeControl(drawControlRef.current);
      setIsDrawing(false);
    } else {
      map.addControl(drawControlRef.current);
      setIsDrawing(true);
    }
  };

  const handleLayerToggle = (layer: 'zones' | 'centers' | 'routes' | 'emergencyRequests') => {
    if (!map) return;

    switch (layer) {
      case 'zones':
        if (showZones) {
          map.removeLayer(zonesLayerRef.current!);
        } else {
          map.addLayer(zonesLayerRef.current!);
        }
        setShowZones(!showZones);
        break;
      case 'centers':
        if (showCenters) {
          map.removeLayer(centersLayerRef.current!);
        } else {
          map.addLayer(centersLayerRef.current!);
        }
        setShowCenters(!showCenters);
        break;
      case 'routes':
        if (showRoutes) {
          map.removeLayer(routesLayerRef.current!);
        } else {
          map.addLayer(routesLayerRef.current!);
        }
        setShowRoutes(!showRoutes);
        break;
      case 'emergencyRequests':
        if (emergencyRequestsLayerRef.current) {
          if (showEmergencyRequests) {
            map.removeLayer(emergencyRequestsLayerRef.current);
          } else {
            map.addLayer(emergencyRequestsLayerRef.current);
          }
        }
        setShowEmergencyRequests(!showEmergencyRequests);
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempLayer) return;

    try {
      const coordinates = (tempLayer as any).getLatLngs()[0].map((latlng: any) => [latlng.lat, latlng.lng]);
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast({ title: "Please login to add disaster zones", variant: "destructive" });
        return;
      }

      // Get user's barangay ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('brgyid')
        .eq('id', userData.user.id)
        .single();

      if (!profile?.brgyid) {
        toast({ title: "Unable to determine your barangay", variant: "destructive" });
        return;
      }

      const { data, error } = await supabase
        .from('disaster_zones')
        .insert({
          zone_name: formData.zoneName,
          zone_type: formData.disasterType as 'flood' | 'fire' | 'landslide' | 'earthquake' | 'typhoon' | 'other',
          risk_level: formData.riskLevel,
          notes: formData.notes,
          polygon_coords: coordinates,
          brgyid: profile.brgyid,
          created_by: userData.user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Disaster zone added successfully!" });
      
      // Update local state
      const newZone: DisasterZone = {
        id: data.id,
        zone_name: data.zone_name,
        zone_type: data.zone_type,
        risk_level: data.risk_level as 'low' | 'medium' | 'high',
        notes: data.notes,
        polygon_coords: data.polygon_coords as [number, number][]
      };
      
      setDisasterZones([...disasterZones, newZone]);
      
      setTempLayer(null);
      setShowModal(false);
      setFormData({ zoneName: '', disasterType: 'flood', riskLevel: 'medium', notes: '' });
    } catch (error) {
      console.error('Error saving disaster zone:', error);
      toast({ title: "Error saving disaster zone", variant: "destructive" });
    }
  };

  const closeModal = () => {
    if (tempLayer && map) {
      map.removeLayer(tempLayer);
    }
    setTempLayer(null);
    setShowModal(false);
    setFormData({ zoneName: '', disasterType: 'flood', riskLevel: 'medium', notes: '' });
  };

  const closeCenterModal = () => {
    if (tempLayer && map) {
      map.removeLayer(tempLayer);
    }
    setTempLayer(null);
    setTempCoordinates(null);
    setShowCenterModal(false);
  };

  const closeRouteModal = () => {
    if (tempLayer && map) {
      map.removeLayer(tempLayer);
    }
    setTempLayer(null);
    setTempCoordinates(null);
    setShowRouteModal(false);
  };

  const handleCenterSuccess = () => {
    fetchEvacCenters();
  };

  const handleRouteSuccess = () => {
    fetchSafeRoutes();
  };

  const focusOnItem = (item: DisasterZone | EvacCenter | SafeRoute, type: string) => {
    if (!map) return;

    if (type === 'zone') {
      const zone = item as DisasterZone;
      if (zone.polygon_coords) {
        map.fitBounds(L.polygon(zone.polygon_coords).getBounds());
      }
    } else if (type === 'center') {
      const center = item as EvacCenter;
      if (center.latitude && center.longitude) {
        map.setView([center.latitude, center.longitude], 15);
      }
    } else if (type === 'route') {
      const route = item as SafeRoute;
      if (route.route_coords) {
        map.fitBounds(L.polyline(route.route_coords).getBounds());
      }
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Left Sidebar */}
      <aside className="w-full md:w-1/3 lg:w-1/4 bg-card border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-bold text-foreground">Emergency Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all emergency-related locations.</p>
        </div>

        {/* Layer Toggles */}
        <div className="p-4 border-b border-border space-y-2">
          <h3 className="font-semibold text-foreground">Map Layers</h3>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showZones}
              onChange={() => handleLayerToggle('zones')}
              className="form-checkbox text-red-600" 
            />
            <span className="text-sm text-destructive">Disaster Zones</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showCenters}
              onChange={() => handleLayerToggle('centers')}
              className="form-checkbox accent-primary" 
            />
            <span className="text-sm text-primary">Evacuation Centers</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showRoutes}
              onChange={() => handleLayerToggle('routes')}
              className="form-checkbox accent-primary" 
            />
            <span className="text-sm text-primary">Safe Routes</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showEmergencyRequests}
              onChange={() => handleLayerToggle('emergencyRequests')}
              className="form-checkbox accent-destructive" 
            />
            <span className="text-sm text-destructive flex items-center gap-1">
              🚨 Emergency Requests
              {emergencyRequests.length > 0 && (
                <span className="bg-destructive text-destructive-foreground text-xs px-1.5 py-0.5 rounded-full">
                  {emergencyRequests.length}
                </span>
              )}
            </span>
          </label>
        </div>

        {/* Accordion Lists */}
        <div className="flex-grow overflow-y-auto">
          <Accordion type="multiple" defaultValue={["zones", "centers", "routes"]} className="w-full">
            {/* Disaster Zones */}
            <AccordionItem value="zones" className="border-b">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  </svg>
                  <span className="font-semibold text-foreground">Disaster Zones</span>
                  <span className="ml-auto text-sm text-muted-foreground">({disasterZones.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pb-0">
                {disasterZones.map(zone => (
                  <div 
                    key={zone.id}
                    className="px-4 py-3 border-t border-border hover:bg-accent transition-colors flex items-center justify-between"
                  >
                    <div
                      className="cursor-pointer flex-1"
                      onClick={() => focusOnItem(zone, 'zone')}
                    >
                      <h4 className="font-semibold text-foreground">{zone.zone_name}</h4>
                      <p className={`text-sm ${zone.risk_level === 'high' ? 'text-red-600' : zone.risk_level === 'medium' ? 'text-orange-500' : 'text-green-600'}`}>
                        Risk: <span className="font-medium capitalize">{zone.risk_level}</span>
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedZone(zone);
                        setShowZoneDetails(true);
                      }}
                      className="ml-2 p-1 hover:bg-accent rounded transition-colors"
                      title="View details"
                    >
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>

            {/* Evacuation Centers */}
            <AccordionItem value="centers" className="border-b">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                  </svg>
                  <span className="font-semibold text-foreground">Evacuation Centers</span>
                  <span className="ml-auto text-sm text-muted-foreground">({evacCenters.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pb-0">
                {evacCenters.map(center => (
                  <div 
                    key={center.id}
                    className="px-4 py-3 border-t border-border hover:bg-accent transition-colors flex items-center justify-between"
                  >
                    <div
                      className="cursor-pointer flex-1"
                      onClick={() => focusOnItem(center, 'center')}
                    >
                      <h4 className="font-semibold text-foreground">{center.name}</h4>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCenter(center);
                        setShowCenterDetails(true);
                      }}
                      className="ml-2 p-1 hover:bg-accent rounded transition-colors"
                      title="View details"
                    >
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>

            {/* Safe Routes */}
            <AccordionItem value="routes" className="border-b">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 16.382V5.618a1 1 0 00-1.447-.894L15 7m-6 3v7m6-10V7"></path>
                  </svg>
                  <span className="font-semibold text-foreground">Safe Routes</span>
                  <span className="ml-auto text-sm text-muted-foreground">({safeRoutes.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pb-0">
                {safeRoutes.map(route => (
                  <div 
                    key={route.id}
                    className="px-4 py-3 border-t border-border hover:bg-accent transition-colors flex items-center justify-between"
                  >
                    <div
                      className="cursor-pointer flex-1"
                      onClick={() => focusOnItem(route, 'route')}
                    >
                      <h4 className="font-semibold text-foreground">{route.route_name}</h4>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRoute(route);
                        setShowRouteDetails(true);
                      }}
                      className="ml-2 p-1 hover:bg-accent rounded transition-colors"
                      title="View details"
                    >
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          {isAdmin ? (
            <button 
              onClick={toggleDrawing}
              className={`w-full font-semibold py-3 rounded-lg transition ${
                isDrawing 
                  ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' 
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground'
              }`}
            >
              {isDrawing ? 'Cancel Drawing' : '+ Add New Location'}
            </button>
          ) : (
            <button 
              onClick={() => setShowEmergencyForm(true)}
              className="w-full font-semibold py-3 rounded-lg transition bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
            >
              <AlertCircle className="h-5 w-5" />
              🆘 Request Emergency Help
            </button>
          )}
        </div>
      </aside>

      {/* Map Container */}
      <main className="flex-1 relative">
        <div ref={mapRef} className="h-full w-full bg-muted relative z-10" />
        
        {/* Floating Toggle Button */}
        <EmergencyFeedToggle 
          requestCount={emergencyRequests.length}
          isOpen={isFeedOpen}
          onToggle={() => setIsFeedOpen(!isFeedOpen)}
        />
        
        {/* Floating Emergency Feed Panel */}
        {isAdmin ? (
          <EmergencyTriageFeed
            brgyid={userProfile?.brgyid || ''}
            isOpen={isFeedOpen}
            onClose={() => setIsFeedOpen(false)}
            onRequestClick={(requestId) => {
              setSelectedRequestId(requestId);
              setShowRequestDetails(true);
            }}
          />
        ) : (
          <UserEmergencyRequests 
            isOpen={isFeedOpen}
            onClose={() => setIsFeedOpen(false)}
          />
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[2000]">
          <div className="bg-card rounded-lg shadow-xl p-8 w-full max-w-md border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-1">Add Disaster Zone</h2>
            <p className="text-sm text-muted-foreground mb-6">Add a new disaster risk zone for your barangay.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground">Zone Name</label>
                <input 
                  type="text" 
                  value={formData.zoneName}
                  onChange={(e) => setFormData({...formData, zoneName: e.target.value})}
                  placeholder="e.g., Riverside Flood Area" 
                  className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Disaster Type</label>
                <select 
                  value={formData.disasterType}
                  onChange={(e) => setFormData({...formData, disasterType: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                >
                  <option value="flood">Flood Zone</option>
                  <option value="fire">Fire Hazard</option>
                  <option value="landslide">Landslide Risk</option>
                  <option value="earthquake">Earthquake Fault</option>
                  <option value="typhoon">Typhoon Path</option>
                  <option value="other">Other Hazard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Risk Level</label>
                <select 
                  value={formData.riskLevel}
                  onChange={(e) => setFormData({...formData, riskLevel: e.target.value as 'low' | 'medium' | 'high'})}
                  className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                >
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Notes (Optional)</label>
                <textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3} 
                  placeholder="e.g., Prone to flash floods during heavy rain." 
                  className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="px-4 py-2 bg-secondary text-secondary-foreground font-semibold rounded-lg hover:bg-secondary/80"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90"
                >
                  Save Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Evacuation Center Modal */}
      <AddEvacuationCenterModal
        isOpen={showCenterModal}
        onClose={closeCenterModal}
        coordinates={tempCoordinates}
        onSuccess={handleCenterSuccess}
      />

      {/* Evacuation Route Modal */}
      <AddEvacuationRouteModal
        isOpen={showRouteModal}
        onClose={closeRouteModal}
        coordinates={tempCoordinates}
        onSuccess={handleRouteSuccess}
      />

      {/* Detail Modals */}
      <DisasterZoneDetailsModal
        isOpen={showZoneDetails}
        onClose={() => setShowZoneDetails(false)}
        zone={selectedZone}
        onEdit={async () => {
          const freshZones = await fetchDisasterZones();
          // Update selected zone with fresh data to keep modal open
          if (selectedZone) {
            const updatedZone = freshZones.find(z => z.id === selectedZone.id);
            if (updatedZone) {
              setSelectedZone(updatedZone);
            }
          }
        }}
      />

      <EvacuationCenterDetailsModal
        isOpen={showCenterDetails}
        onClose={() => setShowCenterDetails(false)}
        center={selectedCenter}
        onUpdate={() => {
          fetchEvacCenters();
        }}
        onEdit={async () => {
          const freshCenters = await fetchEvacCenters();
          // Update selected center with fresh data to keep modal open
          if (selectedCenter) {
            const updatedCenter = freshCenters.find(c => c.id === selectedCenter.id);
            if (updatedCenter) {
              setSelectedCenter(updatedCenter);
            }
          }
        }}
      />

      <EvacuationRouteDetailsModal
        isOpen={showRouteDetails}
        onClose={() => setShowRouteDetails(false)}
        route={selectedRoute}
        onEdit={async () => {
          const freshRoutes = await fetchSafeRoutes();
          // Update selected route with fresh data to keep modal open
          if (selectedRoute) {
            const updatedRoute = freshRoutes.find(r => r.id === selectedRoute.id);
            if (updatedRoute) {
              setSelectedRoute(updatedRoute);
            }
          }
        }}
      />

      {userProfile && (
        <EmergencyRequestForm
          isOpen={showEmergencyForm}
          onClose={() => setShowEmergencyForm(false)}
          userProfile={userProfile}
        />
      )}

      <EmergencyRequestDetailsModal
        requestId={selectedRequestId}
        isOpen={showRequestDetails}
        onClose={() => {
          setShowRequestDetails(false);
          setSelectedRequestId(null);
        }}
        isAdmin={isAdmin}
      />
    </div>
  );
};

export default RiskMapPage;
