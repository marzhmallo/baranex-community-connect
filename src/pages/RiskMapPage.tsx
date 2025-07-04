import { useState, useEffect, useRef } from "react";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  zone_type: string;
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
  current_occupancy: number | null;
  status: string | null;
}

interface SafeRoute {
  id: string;
  route_name: string;
  route_coords: [number, number][];
  start_point: { lat: number; lng: number };
  end_point: { lat: number; lng: number };
}

const RiskMapPage = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [showZones, setShowZones] = useState(true);
  const [showCenters, setShowCenters] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [tempLayer, setTempLayer] = useState<L.Layer | null>(null);
  const { toast } = useToast();
  
  // Layer groups
  const zonesLayerRef = useRef<L.FeatureGroup | null>(null);
  const centersLayerRef = useRef<L.FeatureGroup | null>(null);
  const routesLayerRef = useRef<L.FeatureGroup | null>(null);
  const drawControlRef = useRef<L.Control.Draw | null>(null);

  // Database-connected data
  const [disasterZones, setDisasterZones] = useState<DisasterZone[]>([]);
  const [evacCenters, setEvacCenters] = useState<EvacCenter[]>([]);
  const [safeRoutes, setSafeRoutes] = useState<SafeRoute[]>([]);

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
    } catch (error) {
      console.error('Error fetching disaster zones:', error);
      toast({ title: "Error fetching disaster zones", variant: "destructive" });
    }
  };

  const fetchEvacCenters = async () => {
    try {
      const { data, error } = await supabase
        .from('evacuation_centers')
        .select('*');
      
      if (error) throw error;
      setEvacCenters(data || []);
    } catch (error) {
      console.error('Error fetching evacuation centers:', error);
      toast({ title: "Error fetching evacuation centers", variant: "destructive" });
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
        end_point: route.end_point as { lat: number; lng: number }
      }));
      setSafeRoutes(transformedData);
    } catch (error) {
      console.error('Error fetching evacuation routes:', error);
      toast({ title: "Error fetching evacuation routes", variant: "destructive" });
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchDisasterZones();
    fetchEvacCenters();
    fetchSafeRoutes();
  }, []);

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
      if (zone.polygon_coords) {
        const coords = zone.polygon_coords as [number, number][];
        const polygon = L.polygon(coords, { color: 'red' }).bindPopup(zone.zone_name);
        zonesLayer.addLayer(polygon);
      }
    });

    // Render evacuation centers
    evacCenters.forEach(center => {
      if (center.latitude && center.longitude) {
        const coords: [number, number] = [center.latitude, center.longitude];
        const marker = L.marker(coords, { icon: createIcon('green') }).bindPopup(center.name);
        centersLayer.addLayer(marker);
      }
    });

    // Render safe routes
    safeRoutes.forEach(route => {
      if (route.route_coords) {
        const coords = route.route_coords as [number, number][];
        const polyline = L.polyline(coords, { color: 'blue' }).bindPopup(route.route_name);
        routesLayer.addLayer(polyline);
      }
    });
  };

  // Re-render map data when data changes
  useEffect(() => {
    if (map && zonesLayerRef.current && centersLayerRef.current && routesLayerRef.current) {
      renderMapData(map, zonesLayerRef.current, centersLayerRef.current, routesLayerRef.current);
    }
  }, [disasterZones, evacCenters, safeRoutes, map]);

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
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Left Sidebar */}
      <aside className="w-full md:w-1/3 lg:w-1/4 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-800">Emergency Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all emergency-related locations.</p>
        </div>

        {/* Layer Toggles */}
        <div className="p-4 border-b space-y-2">
          <h3 className="font-semibold text-gray-700">Map Layers</h3>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showZones}
              onChange={() => handleLayerToggle('zones')}
              className="form-checkbox text-red-600" 
            />
            <span className="text-sm text-red-600">Disaster Zones</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showCenters}
              onChange={() => handleLayerToggle('centers')}
              className="form-checkbox text-green-600" 
            />
            <span className="text-sm text-green-600">Evacuation Centers</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showRoutes}
              onChange={() => handleLayerToggle('routes')}
              className="form-checkbox text-blue-600" 
            />
            <span className="text-sm text-blue-600">Safe Routes</span>
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
                  <span className="font-semibold text-gray-800">Disaster Zones</span>
                  <span className="ml-auto text-sm text-gray-500">({disasterZones.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pb-0">
                {disasterZones.map(zone => (
                  <div 
                    key={zone.id}
                    className="px-4 py-3 border-t cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => focusOnItem(zone, 'zone')}
                  >
                    <h4 className="font-semibold text-gray-700">{zone.zone_name}</h4>
                    <p className={`text-sm ${zone.risk_level === 'high' ? 'text-red-600' : zone.risk_level === 'medium' ? 'text-orange-500' : 'text-green-600'}`}>
                      Risk: <span className="font-medium capitalize">{zone.risk_level}</span>
                    </p>
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
                  <span className="font-semibold text-gray-800">Evacuation Centers</span>
                  <span className="ml-auto text-sm text-gray-500">({evacCenters.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pb-0">
                {evacCenters.map(center => (
                  <div 
                    key={center.id}
                    className="px-4 py-3 border-t cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => focusOnItem(center, 'center')}
                  >
                    <h4 className="font-semibold text-gray-700">{center.name}</h4>
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
                  <span className="font-semibold text-gray-800">Safe Routes</span>
                  <span className="ml-auto text-sm text-gray-500">({safeRoutes.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pb-0">
                {safeRoutes.map(route => (
                  <div 
                    key={route.id}
                    className="px-4 py-3 border-t cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => focusOnItem(route, 'route')}
                  >
                    <h4 className="font-semibold text-gray-700">{route.route_name}</h4>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <button 
            onClick={toggleDrawing}
            className={`w-full font-semibold py-3 rounded-lg transition ${
              isDrawing 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isDrawing ? 'Cancel Drawing' : '+ Add New Location'}
          </button>
        </div>
      </aside>

      {/* Map Container */}
      <main className="flex-1 relative">
        <div ref={mapRef} className="h-full w-full bg-gray-300" />
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[2000]">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Add Disaster Zone</h2>
            <p className="text-sm text-gray-500 mb-6">Add a new disaster risk zone for your barangay.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Zone Name</label>
                <input 
                  type="text" 
                  value={formData.zoneName}
                  onChange={(e) => setFormData({...formData, zoneName: e.target.value})}
                  placeholder="e.g., Riverside Flood Area" 
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Disaster Type</label>
                <select 
                  value={formData.disasterType}
                  onChange={(e) => setFormData({...formData, disasterType: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                <label className="block text-sm font-medium text-gray-700">Risk Level</label>
                <select 
                  value={formData.riskLevel}
                  onChange={(e) => setFormData({...formData, riskLevel: e.target.value as 'low' | 'medium' | 'high'})}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                <textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3} 
                  placeholder="e.g., Prone to flash floods during heavy rain." 
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
                >
                  Save Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskMapPage;
