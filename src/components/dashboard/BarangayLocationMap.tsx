
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Save } from 'lucide-react';
import L from 'leaflet';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface BarangayLocationMapProps {
  barangayName?: string;
}

const BarangayLocationMap: React.FC<BarangayLocationMapProps> = ({ barangayName }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { userProfile } = useAuth();

  // Default location (Philippines center)
  const defaultLocation = { lat: 12.8797, lng: 121.7740 };

  useEffect(() => {
    if (!userProfile?.brgyid) return;
    fetchCurrentLocation();
  }, [userProfile?.brgyid]);

  useEffect(() => {
    // Initialize map when component mounts and mapRef is available
    const initMap = () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      try {
        const mapCenter = currentLocation || defaultLocation;
        
        // Create the map with proper initialization
        const map = L.map(mapRef.current, {
          center: [mapCenter.lat, mapCenter.lng],
          zoom: currentLocation ? 15 : 6,
          zoomControl: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          boxZoom: true,
          keyboard: true,
          dragging: true,
          touchZoom: true
        });

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19
        }).addTo(map);

        mapInstanceRef.current = map;

        // Create custom marker icon for barangay hall
        const customIcon = L.divIcon({
          html: `
            <div style="
              background-color: #ef4444;
              width: 24px;
              height: 24px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              position: relative;
            ">
              <div style="
                width: 8px;
                height: 8px;
                background-color: white;
                border-radius: 50%;
                position: absolute;
                top: 4px;
                left: 4px;
              "></div>
            </div>
          `,
          className: 'custom-div-icon',
          iconSize: [24, 24],
          iconAnchor: [12, 24],
        });

        // Add marker if we have a current location
        if (currentLocation) {
          const marker = L.marker([currentLocation.lat, currentLocation.lng], { 
            icon: customIcon,
            draggable: true 
          }).addTo(map);
          
          markerRef.current = marker;
          
          // Add drag event listener
          marker.on('dragend', () => {
            const newPosition = marker.getLatLng();
            setCurrentLocation({
              lat: newPosition.lat,
              lng: newPosition.lng
            });
            setHasUnsavedChanges(true);
          });

          // Add popup to marker
          marker.bindPopup(`${barangayName || 'Barangay'} Hall Location`);
        }

        // Add click event listener to map for placing/moving marker
        map.on('click', (e: L.LeafletMouseEvent) => {
          const newPosition = {
            lat: e.latlng.lat,
            lng: e.latlng.lng
          };

          // Remove existing marker if any
          if (markerRef.current) {
            map.removeLayer(markerRef.current);
          }

          // Create new marker at clicked position
          const marker = L.marker([e.latlng.lat, e.latlng.lng], { 
            icon: customIcon,
            draggable: true 
          }).addTo(map);
          
          markerRef.current = marker;
          setCurrentLocation(newPosition);
          setHasUnsavedChanges(true);

          // Add drag event listener to new marker
          marker.on('dragend', () => {
            const draggedPosition = marker.getLatLng();
            setCurrentLocation({
              lat: draggedPosition.lat,
              lng: draggedPosition.lng
            });
            setHasUnsavedChanges(true);
          });

          // Add popup to marker
          marker.bindPopup(`${barangayName || 'Barangay'} Hall Location`).openPopup();
        });

        console.log('Map initialized successfully');
        
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initMap, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [currentLocation, barangayName]);

  const fetchCurrentLocation = async () => {
    if (!userProfile?.brgyid) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('barangays')
        .select('halllat, halllong')
        .eq('id', userProfile.brgyid)
        .single();

      if (error) throw error;

      if (data.halllat && data.halllong) {
        setCurrentLocation({ lat: data.halllat, lng: data.halllong });
      }
    } catch (error) {
      console.error('Error fetching current location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveLocation = async () => {
    if (!currentLocation || !userProfile?.brgyid) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('barangays')
        .update({
          halllat: currentLocation.lat,
          halllong: currentLocation.lng,
          updated_at: new Date().toISOString()
        })
        .eq('id', userProfile.brgyid);

      if (error) throw error;

      setHasUnsavedChanges(false);
      toast({
        title: "Success",
        description: "Barangay hall location saved successfully!",
      });
    } catch (error) {
      console.error('Error saving location:', error);
      toast({
        title: "Error",
        description: "Failed to save location. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Barangay Hall Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Barangay Hall Location
          </CardTitle>
          {hasUnsavedChanges && (
            <Button 
              onClick={saveLocation} 
              disabled={isSaving}
              size="sm"
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Location'}
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Click on the map or drag the marker to set your barangay hall location
        </p>
      </CardHeader>
      <CardContent>
        <div 
          ref={mapRef} 
          className="w-full h-[400px] rounded-lg border border-border bg-gray-100"
          style={{ minHeight: '400px' }}
        />
        {currentLocation && (
          <div className="mt-3 text-sm text-muted-foreground">
            Current coordinates: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BarangayLocationMap;
