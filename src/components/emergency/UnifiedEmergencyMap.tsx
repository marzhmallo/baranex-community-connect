import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Users, Navigation, MapPin, Shield } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
  risk_level: string;
  polygon_coords: any;
  notes?: string;
}

interface EvacuationCenter {
  id: string;
  name: string;
  address: string;
  capacity: number;
  status: string;
  latitude?: number;
  longitude?: number;
  contact_person?: string;
  contact_phone?: string;
}

interface EvacuationRoute {
  id: string;
  route_name: string;
  start_point: any;
  end_point: any;
  route_coords: any;
  distance_km?: number;
  estimated_time_minutes?: number;
}

const UnifiedEmergencyMap = () => {
  const { userProfile } = useAuth();
  const [disasterZones, setDisasterZones] = useState<DisasterZone[]>([]);
  const [evacuationCenters, setEvacuationCenters] = useState<EvacuationCenter[]>([]);
  const [evacuationRoutes, setEvacuationRoutes] = useState<EvacuationRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showCenters, setShowCenters] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const zonesLayerRef = useRef<L.LayerGroup | null>(null);
  const centersLayerRef = useRef<L.LayerGroup | null>(null);
  const routesLayerRef = useRef<L.LayerGroup | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);

  // Default location (Philippines center)
  const defaultLocation = { lat: 12.8797, lng: 121.7740 };

  useEffect(() => {
    if (userProfile?.brgyid) {
      fetchAllData();
    }
  }, [userProfile?.brgyid]);

  // Initialize map with proper size handling
  useEffect(() => {
    if (!mapRef.current || mapInitialized) return;

    // Use setTimeout to ensure DOM is fully rendered
    const initTimer = setTimeout(() => {
      try {
        const map = L.map(mapRef.current!, {
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

        // Initialize layer groups
        const zonesLayer = L.layerGroup();
        const centersLayer = L.layerGroup();
        const routesLayer = L.layerGroup();

        map.addLayer(zonesLayer);
        map.addLayer(centersLayer);
        map.addLayer(routesLayer);

        mapInstanceRef.current = map;
        zonesLayerRef.current = zonesLayer;
        centersLayerRef.current = centersLayer;
        routesLayerRef.current = routesLayer;
        setMapInitialized(true);

        // Force map size invalidation after initialization
        setTimeout(() => {
          map.invalidateSize(true);
          console.log('Map size invalidated after initialization');
        }, 100);

        console.log('Unified map initialized successfully');
        
      } catch (error) {
        console.error('Error initializing unified map:', error);
      }
    }, 100);

    return () => {
      clearTimeout(initTimer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        zonesLayerRef.current = null;
        centersLayerRef.current = null;
        routesLayerRef.current = null;
        setMapInitialized(false);
      }
    };
  }, [mapRef.current]);

  // Force map resize when data changes and map is ready
  useEffect(() => {
    if (mapInitialized && mapInstanceRef.current) {
      // Small delay to ensure rendering is complete
      const resizeTimer = setTimeout(() => {
        mapInstanceRef.current!.invalidateSize(true);
        renderAllMapLayers();
        console.log('Map resized and layers rendered');
      }, 150);

      return () => clearTimeout(resizeTimer);
    }
  }, [disasterZones, evacuationCenters, evacuationRoutes, mapInitialized, showZones, showCenters, showRoutes]);

  // Force resize on window resize or visibility change
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        setTimeout(() => {
          mapInstanceRef.current!.invalidateSize(true);
        }, 100);
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && mapInstanceRef.current) {
        setTimeout(() => {
          mapInstanceRef.current!.invalidateSize(true);
        }, 200);
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      // Fetch disaster zones
      const { data: zones, error: zonesError } = await supabase
        .from('disaster_zones')
        .select('*')
        .eq('brgyid', userProfile?.brgyid);

      if (zonesError) throw zonesError;

      // Fetch evacuation centers
      const { data: centers, error: centersError } = await supabase
        .from('evacuation_centers')
        .select('*')
        .eq('brgyid', userProfile?.brgyid);

      if (centersError) throw centersError;

      // Fetch evacuation routes
      const { data: routes, error: routesError } = await supabase
        .from('evacuation_routes')
        .select('*')
        .eq('brgyid', userProfile?.brgyid);

      if (routesError) throw routesError;

      setDisasterZones(zones || []);
      setEvacuationCenters(centers || []);
      setEvacuationRoutes(routes || []);

    } catch (error) {
      console.error('Error fetching emergency data:', error);
      toast({
        title: "Error",
        description: "Failed to load emergency data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderAllMapLayers = () => {
    if (!mapInstanceRef.current || !zonesLayerRef.current || !centersLayerRef.current || !routesLayerRef.current) return;

    // Clear all layers
    zonesLayerRef.current.clearLayers();
    centersLayerRef.current.clearLayers();
    routesLayerRef.current.clearLayers();

    // Render disaster zones
    if (showZones) {
      disasterZones.forEach(zone => {
        if (zone.polygon_coords) {
          try {
            const color = zone.risk_level === 'high' ? 'red' : zone.risk_level === 'medium' ? 'orange' : 'yellow';
            const polygon = L.polygon(zone.polygon_coords, { color, fillColor: color, fillOpacity: 0.3 });
            polygon.bindPopup(`
              <strong>${zone.zone_name}</strong><br>
              Type: ${zone.zone_type}<br>
              Risk Level: ${zone.risk_level}<br>
              ${zone.notes ? `Notes: ${zone.notes}` : ''}
            `);
            zonesLayerRef.current!.addLayer(polygon);
          } catch (error) {
            console.error('Error rendering zone:', zone.zone_name, error);
          }
        }
      });
    }

    // Render evacuation centers
    if (showCenters) {
      evacuationCenters.forEach(center => {
        if (center.latitude && center.longitude) {
          const marker = L.marker([center.latitude, center.longitude]);
          marker.bindPopup(`
            <strong>${center.name}</strong><br>
            Address: ${center.address}<br>
            Capacity: ${center.capacity}<br>
            Status: ${center.status}<br>
            ${center.contact_person ? `Contact: ${center.contact_person}` : ''}
          `);
          centersLayerRef.current!.addLayer(marker);
        }
      });
    }

    // Render evacuation routes
    if (showRoutes) {
      evacuationRoutes.forEach(route => {
        if (route.route_coords) {
          try {
            const polyline = L.polyline(route.route_coords, { color: 'blue', weight: 4 });
            polyline.bindPopup(`
              <strong>${route.route_name}</strong><br>
              ${route.distance_km ? `Distance: ${route.distance_km} km` : ''}<br>
              ${route.estimated_time_minutes ? `Est. Time: ${route.estimated_time_minutes} min` : ''}
            `);
            routesLayerRef.current!.addLayer(polyline);
          } catch (error) {
            console.error('Error rendering route:', route.route_name, error);
          }
        }
      });
    }

    // Fit map to show all layers
    const allLayers = [
      ...zonesLayerRef.current.getLayers(),
      ...centersLayerRef.current.getLayers(),
      ...routesLayerRef.current.getLayers()
    ];

    if (allLayers.length > 0) {
      const group = L.featureGroup(allLayers);
      try {
        mapInstanceRef.current.fitBounds(group.getBounds(), { padding: [20, 20] });
      } catch (error) {
        console.error('Error fitting bounds:', error);
      }
    }
  };

  const focusOnItem = (item: any, type: string) => {
    if (!mapInstanceRef.current) return;

    try {
      if (type === 'zone' && item.polygon_coords) {
        const polygon = L.polygon(item.polygon_coords);
        mapInstanceRef.current.fitBounds(polygon.getBounds());
      } else if (type === 'center' && item.latitude && item.longitude) {
        mapInstanceRef.current.setView([item.latitude, item.longitude], 16);
      } else if (type === 'route' && item.route_coords) {
        const polyline = L.polyline(item.route_coords);
        mapInstanceRef.current.fitBounds(polyline.getBounds());
      }
    } catch (error) {
      console.error('Error focusing on item:', error);
    }
  };

  const toggleLayer = (layerType: string) => {
    if (!mapInstanceRef.current) return;

    switch (layerType) {
      case 'zones':
        if (showZones) {
          mapInstanceRef.current.removeLayer(zonesLayerRef.current!);
        } else {
          mapInstanceRef.current.addLayer(zonesLayerRef.current!);
        }
        setShowZones(!showZones);
        break;
      case 'centers':
        if (showCenters) {
          mapInstanceRef.current.removeLayer(centersLayerRef.current!);
        } else {
          mapInstanceRef.current.addLayer(centersLayerRef.current!);
        }
        setShowCenters(!showCenters);
        break;
      case 'routes':
        if (showRoutes) {
          mapInstanceRef.current.removeLayer(routesLayerRef.current!);
        } else {
          mapInstanceRef.current.addLayer(routesLayerRef.current!);
        }
        setShowRoutes(!showRoutes);
        break;
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Emergency Management Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-[600px] overflow-hidden rounded-lg border">
          {/* Left Panel - Accordion List */}
          <aside className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
            {/* Layer Toggles */}
            <div className="p-4 border-b space-y-2">
              <h3 className="font-semibold text-gray-700">Map Layers</h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showZones}
                    onChange={() => toggleLayer('zones')}
                    className="form-checkbox text-red-600"
                  />
                  <span className="text-sm text-red-600">Disaster Zones</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCenters}
                    onChange={() => toggleLayer('centers')}
                    className="form-checkbox text-green-600"
                  />
                  <span className="text-sm text-green-600">Evacuation Centers</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showRoutes}
                    onChange={() => toggleLayer('routes')}
                    className="form-checkbox text-blue-600"
                  />
                  <span className="text-sm text-blue-600">Safe Routes</span>
                </label>
              </div>
            </div>

            {/* Accordion List */}
            <div className="flex-1 overflow-y-auto">
              <Accordion type="multiple" defaultValue={["zones", "centers", "routes"]}>
                {/* Disaster Zones */}
                <AccordionItem value="zones">
                  <AccordionTrigger className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span>Disaster Zones ({disasterZones.length})</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1">
                      {disasterZones.map((zone) => (
                        <div
                          key={zone.id}
                          className="px-6 py-2 cursor-pointer hover:bg-gray-100 border-t"
                          onClick={() => focusOnItem(zone, 'zone')}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{zone.zone_name}</span>
                            <Badge variant={getRiskLevelColor(zone.risk_level) as any} className="text-xs">
                              {zone.risk_level}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500">{zone.zone_type}</p>
                        </div>
                      ))}
                      {disasterZones.length === 0 && (
                        <p className="px-6 py-4 text-sm text-gray-500">No disaster zones found</p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Evacuation Centers */}
                <AccordionItem value="centers">
                  <AccordionTrigger className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-600" />
                      <span>Evacuation Centers ({evacuationCenters.length})</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1">
                      {evacuationCenters.map((center) => (
                        <div
                          key={center.id}
                          className="px-6 py-2 cursor-pointer hover:bg-gray-100 border-t"
                          onClick={() => focusOnItem(center, 'center')}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{center.name}</span>
                            <Badge variant={getStatusColor(center.status) as any} className="text-xs">
                              {center.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500">Capacity: {center.capacity}</p>
                          <p className="text-xs text-gray-500">{center.address}</p>
                        </div>
                      ))}
                      {evacuationCenters.length === 0 && (
                        <p className="px-6 py-4 text-sm text-gray-500">No evacuation centers found</p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Evacuation Routes */}
                <AccordionItem value="routes">
                  <AccordionTrigger className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Navigation className="h-4 w-4 text-blue-600" />
                      <span>Safe Routes ({evacuationRoutes.length})</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1">
                      {evacuationRoutes.map((route) => (
                        <div
                          key={route.id}
                          className="px-6 py-2 cursor-pointer hover:bg-gray-100 border-t"
                          onClick={() => focusOnItem(route, 'route')}
                        >
                          <span className="text-sm font-medium">{route.route_name}</span>
                          {route.distance_km && (
                            <p className="text-xs text-gray-500">Distance: {route.distance_km} km</p>
                          )}
                          {route.estimated_time_minutes && (
                            <p className="text-xs text-gray-500">Est. Time: {route.estimated_time_minutes} min</p>
                          )}
                        </div>
                      ))}
                      {evacuationRoutes.length === 0 && (
                        <p className="px-6 py-4 text-sm text-gray-500">No evacuation routes found</p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </aside>

          {/* Right Panel - Map */}
          <main className="flex-1 relative">
            <div 
              ref={mapRef} 
              className="w-full h-full bg-gray-100"
              style={{ minHeight: '400px' }}
            />
          </main>
        </div>
      </CardContent>
    </Card>
  );
};

export default UnifiedEmergencyMap;
