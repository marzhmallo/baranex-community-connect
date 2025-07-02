
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Save } from 'lucide-react';
import { Loader } from '@googlemaps/js-api-loader';
import GoogleMapsKeyInput from './GoogleMapsKeyInput';

interface BarangayLocationMapProps {
  barangayName?: string;
}

const BarangayLocationMap: React.FC<BarangayLocationMapProps> = ({ barangayName }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const { userProfile } = useAuth();

  // Default location (Philippines center)
  const defaultLocation = { lat: 14.5995, lng: 120.9842 };

  useEffect(() => {
    if (!userProfile?.brgyid) return;
    fetchCurrentLocation();
  }, [userProfile?.brgyid]);

  useEffect(() => {
    if (apiKey && !mapLoaded) {
      loadGoogleMaps();
    }
  }, [apiKey, mapLoaded]);

  const handleApiKeySet = (key: string) => {
    setApiKey(key);
  };

  const loadGoogleMaps = async () => {
    if (!apiKey) return;
    
    setIsLoading(true);
    try {
      const loader = new Loader({
        apiKey: apiKey,
        version: 'weekly',
        libraries: ['places']
      });

      await loader.load();
      setMapLoaded(true);
      initializeMap();
    } catch (error) {
      console.error('Error loading Google Maps:', error);
      toast({
        title: "Error",
        description: "Failed to load Google Maps. Please check your API key.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCurrentLocation = async () => {
    if (!userProfile?.brgyid) return;

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
    }
  };

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    const mapCenter = currentLocation || defaultLocation;

    const map = new google.maps.Map(mapRef.current, {
      zoom: currentLocation ? 17 : 10,
      center: mapCenter,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      streetViewControl: false,
      mapTypeControl: true,
      fullscreenControl: false,
    });

    mapInstanceRef.current = map;

    // Create marker
    const marker = new google.maps.Marker({
      position: mapCenter,
      map: map,
      draggable: true,
      title: `${barangayName || 'Barangay'} Hall Location`,
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg fill="#ef4444" height="40" width="40" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 40),
      }
    });

    markerRef.current = marker;

    // Add drag listener
    marker.addListener('dragend', () => {
      const newPosition = marker.getPosition();
      if (newPosition) {
        setCurrentLocation({
          lat: newPosition.lat(),
          lng: newPosition.lng()
        });
        setHasUnsavedChanges(true);
      }
    });

    // Add click listener to map
    map.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const newPosition = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        };
        marker.setPosition(event.latLng);
        setCurrentLocation(newPosition);
        setHasUnsavedChanges(true);
      }
    });
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

  if (!apiKey) {
    return <GoogleMapsKeyInput onApiKeySet={handleApiKeySet} />;
  }

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
          className="w-full h-[400px] rounded-lg border border-border"
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
