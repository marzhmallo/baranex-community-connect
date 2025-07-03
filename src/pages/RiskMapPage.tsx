import { useState, useEffect, useRef } from "react";
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

const RiskMapPage = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
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

  // Mock data
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
    const initializeMapAsync = async () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      try {
        // Small delay to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 100));

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

        // Set loading to false after map is ready
        setIsMapLoading(false);

      } catch (error) {
        console.error('Error initializing map:', error);
        setIsMapLoading(false);
      }
    };

    initializeMapAsync();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
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

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 animate-fade-in">
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

        {/* Lists */}
        <div className="flex-grow overflow-y-auto">
          {/* Disaster Zones */}
          <div className="border-b">
            <div className="w-full text-left p-4 font-bold text-gray-800 bg-gray-50">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                <span>Disaster Zones</span>
              </div>
            </div>
            <div>
              {disasterZones.map(zone => (
                <div 
                  key={zone.id}
                  className="p-3 pl-12 border-t cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => focusOnItem(zone, 'zone')}
                >
                  <h4 className="font-semibold text-gray-700">{zone.name}</h4>
                  <p className={`text-sm ${zone.risk === 'high' ? 'text-red-600' : zone.risk === 'medium' ? 'text-orange-500' : 'text-green-600'}`}>
                    Risk: <span className="font-medium capitalize">{zone.risk}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Evacuation Centers */}
          <div className="border-b">
            <div className="w-full text-left p-4 font-bold text-gray-800 bg-gray-50">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                </svg>
                <span>Evacuation Centers</span>
              </div>
            </div>
            <div>
              {evacCenters.map(center => (
                <div 
                  key={center.id}
                  className="p-3 pl-12 border-t cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => focusOnItem(center, 'center')}
                >
                  <h4 className="font-semibold text-gray-700">{center.name}</h4>
                </div>
              ))}
            </div>
          </div>

          {/* Safe Routes */}
          <div className="border-b">
            <div className="w-full text-left p-4 font-bold text-gray-800 bg-gray-50">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 16.382V5.618a1 1 0 00-1.447-.894L15 7m-6 3v7m6-10V7"></path>
                </svg>
                <span>Safe Routes</span>
              </div>
            </div>
            <div>
              {safeRoutes.map(route => (
                <div 
                  key={route.id}
                  className="p-3 pl-12 border-t cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => focusOnItem(route, 'route')}
                >
                  <h4 className="font-semibold text-gray-700">{route.name}</h4>
                </div>
              ))}
            </div>
          </div>
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
        {isMapLoading && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading map...</p>
            </div>
          </div>
        )}
        <div 
          ref={mapRef} 
          className={`h-full w-full bg-gray-300 transition-opacity duration-300 ${
            isMapLoading ? 'opacity-0' : 'opacity-100'
          }`} 
        />
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[2000] animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md animate-scale-in">
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
                  <option>🌊 Flood Zone</option>
                  <option>🔥 Fire Hazard</option>
                  <option>⛰️ Landslide Risk</option>
                  <option>🌍 Earthquake Fault</option>
                  <option>🌀 Typhoon Path</option>
                  <option>⚠️ Other Hazard</option>
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
                  className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
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
