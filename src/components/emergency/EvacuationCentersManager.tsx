
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw"; // Import leaflet-draw plugin

interface EvacuationCenter {
  id: string;
  address: string;
  capacity: number;
  status: string;
  latitude?: number;
  longitude?: number;
  contact_person?: string;
  contact_phone?: string;
  current_occupancy?: number;
}

const EvacuationCentersManager = () => {
  const { userProfile } = useAuth();
  const [centers, setCenters] = useState<EvacuationCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<EvacuationCenter>>({});
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);

  // Default location (Philippines center)
  const defaultLocation = { lat: 12.8797, lng: 121.7740 };

  useEffect(() => {
    if (userProfile?.brgyid) {
      fetchCenters();
    }
  }, [userProfile?.brgyid]);

  const fetchCenters = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("evacuation_centers")
        .select("*")
        .eq("brgyid", userProfile?.brgyid);

      if (error) throw error;
      setCenters(data || []);
    } catch (error) {
      console.error("Error fetching evacuation centers:", error);
      toast({
        title: "Error",
        description: "Failed to load evacuation centers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize map with proper error handling
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
        touchZoom: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const drawnItems = L.featureGroup();
      map.addLayer(drawnItems);

      // Fix the L.Control.Draw instantiation
      const drawControl = new L.Control.Draw({
        edit: {
          featureGroup: drawnItems,
          remove: true,
        },
        draw: {
          polygon: false,
          polyline: false,
          rectangle: false,
          circle: false,
          circlemarker: false,
          marker: {
            icon: L.divIcon({
              className:
                "bg-green-500 rounded-full w-6 h-6 flex items-center justify-center",
              html: '<div class="w-3 h-3 bg-white rounded-full"></div>',
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            }),
          },
        },
      });

      map.addControl(drawControl);

      map.on(L.Draw.Event.CREATED, (event: any) => {
        const layer = event.layer;
        const latlng = layer.getLatLng();

        // Set temporary coordinates for the form
        setFormData((prev) => ({
          ...prev,
          latitude: latlng.lat,
          longitude: latlng.lng,
        }));

        drawnItems.addLayer(layer);
        setShowForm(true);
        console.log("Marker created at:", latlng);
      });

      mapInstanceRef.current = map;
      drawnItemsRef.current = drawnItems;
      setMapInitialized(true);

      console.log("Evacuation centers map initialized successfully");
    } catch (error) {
      console.error("Error initializing evacuation centers map:", error);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        drawnItemsRef.current = null;
        setMapInitialized(false);
      }
    };
  }, [mapRef.current]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "capacity" || name === "current_occupancy" ? Number(value) : value,
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.brgyid) return;

    // Validate required fields
    if (!formData.address) {
      toast({
        title: "Error",
        description: "Address is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("evacuation_centers")
        .insert({
          address: formData.address,
          capacity: formData.capacity || 0,
          status: (formData.status as "available" | "full" | "closed" | "maintenance") || 'available',
          latitude: formData.latitude,
          longitude: formData.longitude,
          contact_person: formData.contact_person,
          contact_phone: formData.contact_phone,
          current_occupancy: formData.current_occupancy || 0,
          brgyid: userProfile.brgyid,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Evacuation center added successfully",
      });

      setShowForm(false);
      setFormData({});
      fetchCenters();
      if (drawnItemsRef.current) {
        drawnItemsRef.current.clearLayers();
      }
    } catch (error) {
      console.error("Error adding evacuation center:", error);
      toast({
        title: "Error",
        description: "Failed to add evacuation center",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Evacuation Centers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Button onClick={() => setShowForm((prev) => !prev)}>
              {showForm ? "Cancel" : "Add New Center"}
            </Button>
          </div>

          {showForm && (
            <form onSubmit={handleFormSubmit} className="space-y-4 mb-6">
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address || ""}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min={0}
                  value={formData.capacity || ""}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="current_occupancy">Current Occupancy</Label>
                <Input
                  id="current_occupancy"
                  name="current_occupancy"
                  type="number"
                  min={0}
                  value={formData.current_occupancy || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  value={formData.status || "available"}
                  onChange={handleInputChange}
                  className="w-full border rounded px-2 py-1"
                  required
                >
                  <option value="available">Available</option>
                  <option value="full">Full</option>
                  <option value="closed">Closed</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div>
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  name="contact_person"
                  value={formData.contact_person || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  name="contact_phone"
                  value={formData.contact_phone || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label>Latitude</Label>
                <Input
                  name="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude || ""}
                  onChange={handleInputChange}
                  readOnly
                />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input
                  name="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude || ""}
                  onChange={handleInputChange}
                  readOnly
                />
              </div>
              <Button type="submit" disabled={loading}>
                Save Center
              </Button>
            </form>
          )}

          <div
            ref={mapRef}
            className="w-full h-[400px] rounded border border-gray-300"
            style={{ minHeight: "400px" }}
          />

          <div className="mt-6 space-y-4">
            {centers.length === 0 && (
              <p className="text-center text-muted-foreground">
                No evacuation centers found.
              </p>
            )}
            {centers.map((center) => (
              <Card key={center.id} className="p-4">
                <p>{center.address}</p>
                <p>
                  Capacity: {center.capacity} | Current Occupancy:{" "}
                  {center.current_occupancy || 0}
                </p>
                <p>Status: {center.status}</p>
                {center.contact_person && (
                  <p>
                    Contact: {center.contact_person}{" "}
                    {center.contact_phone && `(${center.contact_phone})`}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EvacuationCentersManager;
