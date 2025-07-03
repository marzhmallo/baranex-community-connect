import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, Users, AlertTriangle, Navigation, Shield } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import { useNavigate, useLocation } from "react-router-dom";

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface DashboardStats {
  emergencyContacts: number;
  disasterZones: number;
  evacuationCenters: number;
  availableCenters: number;
  totalCapacity: number;
  currentOccupancy: number;
}

interface EmergencyContact {
  id: string;
  name: string;
  phone_number: string;
  type: string;
}

interface DisasterZone {
  id: number;
  name: string;
  disasterType: string;
  risk: 'low' | 'medium' | 'high';
  notes: string;
  coordinates: [number, number][];
}

interface EvacCenter {
  id: number;
  name: string;
  coordinates: [number, number];
}

interface SafeRoute {
  id: number;
  name: string;
  coordinates: [number, number][];
}

const EmergencyDashboard = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Dashboard state
  const [stats, setStats] = useState<DashboardStats>({
    emergencyContacts: 0,
    disasterZones: 0,
    evacuationCenters: 0,
    availableCenters: 0,
    totalCapacity: 0,
    currentOccupancy: 0,
  });
  const [quickContacts, setQuickContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);

  // Map state
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [showZones, setShowZones] = useState(true);
  const [showCenters, setShowCenters] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [tempLayer, setTempLayer] = useState<L.Layer | null>(null);
  
  // Layer groups
  const zonesLayerRef = useRef<L.FeatureGroup | null>(null);
  const centersLayerRef = useRef<L.FeatureGroup | null>(null);
  const routesLayerRef = useRef<L.FeatureGroup | null>(null);
  const drawControlRef = useRef<L.Control.Draw | null>(null);

  // Mock data for map
  const [disasterZones, setDisasterZones] = useState<DisasterZone[]>([
    { 
      id: 1, 
      name: 'Riverside Flood Area', 
      disasterType: '🌊 Flood Zone', 
      risk: 'high', 
      notes: 'Prone to flash floods.', 
      coordinates: [[14.60, 121.00], [14.61, 121.01], [14.59, 121.02], [14.60, 121.00]] 
    }
  ]);
  
  const [evacCenters] = useState<EvacCenter[]>([
    { id: 101, name: 'Central Elementary School', coordinates: [14.62, 121.03] }
  ]);
  
  const [safeRoutes] = useState<SafeRoute[]>([
    { id: 201, name: 'Main St. Evac Route', coordinates: [[14.58, 121.00], [14.62, 121.03]] }
  ]);

  // Form state
  const [formData, setFormData] = useState({
    zoneName: '',
    disasterType: '🌊 Flood Zone',
    riskLevel: 'medium' as 'low' | 'medium' | 'high',
    notes: ''
  });

  useEffect(() => {
    if (userProfile?.brgyid) {
      fetchDashboardData();
    }
  }, [userProfile?.brgyid]);

  // Map initialization
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

    const drawControl = new L.Control.Draw({
      edit: { featureGroup: drawnItems },
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
      } else {
        const name = prompt(`Enter a name for the new ${type}:`);
        if (name) {
          layer.bindPopup(`<b>${name}</b>`).openPopup();
        }
      }
      toggleDrawing(); // Exit drawing mode after one shape
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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch emergency contacts count
      const { count: contactsCount } = await supabase
        .from('emergency_contacts')
        .select('*', { count: 'exact', head: true })
        .eq('brgyid', userProfile?.brgyid);

      // Fetch disaster zones count
      const { count: zonesCount } = await supabase
        .from('disaster_zones')
        .select('*', { count: 'exact', head: true })
        .eq('brgyid', userProfile?.brgyid);

      // Fetch evacuation centers data
      const { data: centers, count: centersCount } = await supabase
        .from('evacuation_centers')
        .select('*', { count: 'exact' })
        .eq('brgyid', userProfile?.brgyid);

      // Calculate center statistics
      const availableCenters = centers?.filter(c => c.status === 'available').length || 0;
      const totalCapacity = centers?.reduce((sum, c) => sum + (c.capacity || 0), 0) || 0;
      const currentOccupancy = centers?.reduce((sum, c) => sum + (c.current_occupancy || 0), 0) || 0;

      // Fetch quick access contacts
      const { data: contacts } = await supabase
        .from('emergency_contacts')
        .select('id, name, phone_number, type')
        .eq('brgyid', userProfile?.brgyid)
        .limit(4);

      setStats({
        emergencyContacts: contactsCount || 0,
        disasterZones: zonesCount || 0,
        evacuationCenters: centersCount || 0,
        availableCenters,
        totalCapacity,
        currentOccupancy,
      });

      setQuickContacts(contacts || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const callEmergency = (phoneNumber: string, contactName: string) => {
    if (window.confirm(`Call ${contactName} at ${phoneNumber}?`)) {
      window.open(`tel:${phoneNumber}`);
    }
  };

  const getContactTypeIcon = (type: string) => {
    switch (type) {
      case 'fire': return '🔥';
      case 'police': return '👮';
      case 'medical': return '🚑';
      case 'disaster': return '⛑️';
      case 'rescue': return '🚁';
      default: return '📞';
    }
  };

  const getContactTypeColor = (type: string) => {
    switch (type) {
      case 'fire': return 'destructive';
      case 'police': return 'default';
      case 'medical': return 'secondary';
      case 'disaster': return 'outline';
      case 'rescue': return 'default';
      default: return 'outline';
    }
  };

  // Map helper functions
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

  const renderMapData = (mapInstance: L.Map, zonesLayer: L.FeatureGroup, centersLayer: L.FeatureGroup, routesLayer: L.FeatureGroup) => {
    // Clear existing layers
    zonesLayer.clearLayers();
    centersLayer.clearLayers();
    routesLayer.clearLayers();

    // Render disaster zones
    disasterZones.forEach(zone => {
      const polygon = L.polygon(zone.coordinates, { color: 'red' }).bindPopup(zone.name);
      zonesLayer.addLayer(polygon);
    });

    // Render evacuation centers
    evacCenters.forEach(center => {
      const marker = L.marker(center.coordinates, { icon: createIcon('green') }).bindPopup(center.name);
      centersLayer.addLayer(marker);
    });

    // Render safe routes
    safeRoutes.forEach(route => {
      const polyline = L.polyline(route.coordinates, { color: 'blue' }).bindPopup(route.name);
      routesLayer.addLayer(polyline);
    });
  };

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

  const handleLayerToggle = (layer: 'zones' | 'centers' | 'routes') => {
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
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempLayer) return;

    const newZone: DisasterZone = {
      id: Date.now(),
      name: formData.zoneName,
      disasterType: formData.disasterType,
      risk: formData.riskLevel,
      notes: formData.notes,
      coordinates: (tempLayer as any).getLatLngs()
    };

    setDisasterZones([...disasterZones, newZone]);
    
    if (zonesLayerRef.current) {
      const polygon = L.polygon(newZone.coordinates, { color: 'red' }).bindPopup(newZone.name);
      zonesLayerRef.current.addLayer(polygon);
    }

    setTempLayer(null);
    setShowModal(false);
    setFormData({ zoneName: '', disasterType: '🌊 Flood Zone', riskLevel: 'medium', notes: '' });
  };

  const closeModal = () => {
    if (tempLayer && map) {
      map.removeLayer(tempLayer);
    }
    setTempLayer(null);
    setShowModal(false);
    setFormData({ zoneName: '', disasterType: '🌊 Flood Zone', riskLevel: 'medium', notes: '' });
  };

  const focusOnItem = (item: DisasterZone | EvacCenter | SafeRoute, type: string) => {
    if (!map) return;

    if (type === 'zone') {
      const zone = item as DisasterZone;
      map.fitBounds(L.polygon(zone.coordinates).getBounds());
    } else if (type === 'center') {
      const center = item as EvacCenter;
      map.setView(center.coordinates, 15);
    } else if (type === 'route') {
      const route = item as SafeRoute;
      map.fitBounds(L.polyline(route.coordinates).getBounds());
    }
  };

  const handleViewRiskMap = () => {
    navigate('/emergency?tab=riskmap');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emergency Contacts</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.emergencyContacts}</div>
            <p className="text-xs text-muted-foreground">Active contacts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Zones</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.disasterZones}</div>
            <p className="text-xs text-muted-foreground">Mapped areas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Evacuation Centers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.availableCenters}/{stats.evacuationCenters}</div>
            <p className="text-xs text-muted-foreground">Available centers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capacity</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.currentOccupancy}/{stats.totalCapacity}</div>
            <p className="text-xs text-muted-foreground">Current occupancy</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Emergency Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Quick Emergency Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {quickContacts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {quickContacts.map((contact) => (
                <Card key={contact.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg">{getContactTypeIcon(contact.type)}</span>
                      <Badge variant={getContactTypeColor(contact.type) as any}>
                        {contact.type}
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-sm mb-1">{contact.name}</h4>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => callEmergency(contact.phone_number, contact.name)}
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      {contact.phone_number}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No emergency contacts configured yet. Add contacts in the Emergency Contacts tab.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Status Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Emergency Response System</span>
              <Badge variant="default" className="bg-green-500">Online</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Contact Database</span>
              <Badge variant="default" className="bg-green-500">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Evacuation Centers</span>
              <Badge variant={stats.availableCenters > 0 ? "default" : "destructive"}>
                {stats.availableCenters > 0 ? "Ready" : "Unavailable"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Send Emergency Alert
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={handleViewRiskMap}
            >
              <MapPin className="h-4 w-4 mr-2" />
              View Risk Map
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Navigation className="h-4 w-4 mr-2" />
              Plan Evacuation
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmergencyDashboard;
