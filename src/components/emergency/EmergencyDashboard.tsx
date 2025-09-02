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
      const currentOccupancy = centers?.reduce((sum, c) => sum + (c.occupancy || 0), 0) || 0;

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

  const lowercaseToCapitalize = (type: string): string => {
    const mapping: Record<string, string> = {
      'fire': 'Fire',
      'police': 'Police',
      'medical': 'Medical', 
      'disaster': 'Disaster',
      'rescue': 'Rescue'
    };
    return mapping[type] || type;
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
        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Emergency Contacts</CardTitle>
            <div className="p-2 bg-blue-500/20 rounded-full">
              <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-800 dark:text-blue-200">{stats.emergencyContacts}</div>
            <p className="text-xs text-blue-600/80 dark:text-blue-400/80">Active contacts</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50 hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">Risk Zones</CardTitle>
            <div className="p-2 bg-red-500/20 rounded-full">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-800 dark:text-red-200">{stats.disasterZones}</div>
            <p className="text-xs text-red-600/80 dark:text-red-400/80">Mapped areas</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Evacuation Centers</CardTitle>
            <div className="p-2 bg-green-500/20 rounded-full">
              <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-800 dark:text-green-200">{stats.availableCenters}/{stats.evacuationCenters}</div>
            <p className="text-xs text-green-600/80 dark:text-green-400/80">Available centers</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Capacity</CardTitle>
            <div className="p-2 bg-purple-500/20 rounded-full">
              <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-800 dark:text-purple-200">{stats.currentOccupancy}/{stats.totalCapacity}</div>
            <p className="text-xs text-purple-600/80 dark:text-purple-400/80">Current occupancy</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Emergency Contacts */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-orange-50/50 via-red-50/50 to-pink-50/50 dark:from-orange-950/30 dark:via-red-950/30 dark:to-pink-950/30 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-red-500/10 to-orange-500/10 dark:from-red-500/20 dark:to-orange-500/20 rounded-t-lg border-b border-red-200/30 dark:border-red-700/30">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-red-500/20 rounded-full">
              <Phone className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            Quick Emergency Contacts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {quickContacts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickContacts.map((contact) => (
                <Card key={contact.id} className="group cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-105 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-2xl group-hover:scale-110 transition-transform duration-200">
                        {getContactTypeIcon(contact.type)}
                      </div>
                      <Badge 
                        variant={getContactTypeColor(contact.type) as any}
                        className="group-hover:shadow-lg transition-shadow duration-200"
                      >
                        {lowercaseToCapitalize(contact.type)}
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-sm mb-3 text-gray-800 dark:text-gray-200">{contact.name}</h4>
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
        <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/50 dark:to-emerald-900/50">
          <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 rounded-t-lg border-b border-green-200/30 dark:border-green-700/30">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 bg-green-500/20 rounded-full">
                <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <span className="font-medium">Emergency Response System</span>
              <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700">
                🟢 Online
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <span className="font-medium">Contact Database</span>
              <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700">
                🟢 Active
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <span className="font-medium">Evacuation Centers</span>
              <Badge className={stats.availableCenters > 0 
                ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700" 
                : "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700"
              }>
                {stats.availableCenters > 0 ? "🟢 Ready" : "🔴 Unavailable"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-950/50 dark:to-red-900/50">
          <CardHeader className="bg-gradient-to-r from-orange-500/10 to-red-500/10 dark:from-orange-500/20 dark:to-red-500/20 rounded-t-lg border-b border-orange-200/30 dark:border-orange-700/30">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 bg-orange-500/20 rounded-full">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-6">
            <Button 
              variant="outline" 
              className="w-full justify-start h-12 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-orange-200/50 dark:border-orange-700/50 hover:bg-orange-100/80 dark:hover:bg-orange-900/30 hover:shadow-lg transition-all duration-200"
            >
              <div className="p-1 bg-red-500/20 rounded-full mr-3">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              Send Emergency Alert
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start h-12 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-orange-200/50 dark:border-orange-700/50 hover:bg-orange-100/80 dark:hover:bg-orange-900/30 hover:shadow-lg transition-all duration-200"
              onClick={handleViewRiskMap}
            >
              <div className="p-1 bg-blue-500/20 rounded-full mr-3">
                <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              View Risk Map
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start h-12 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-orange-200/50 dark:border-orange-700/50 hover:bg-orange-100/80 dark:hover:bg-orange-900/30 hover:shadow-lg transition-all duration-200"
            >
              <div className="p-1 bg-green-500/20 rounded-full mr-3">
                <Navigation className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              Plan Evacuation
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmergencyDashboard;
