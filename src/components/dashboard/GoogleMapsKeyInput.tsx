
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Settings, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface GoogleMapsKeyInputProps {
  onApiKeySet: (key: string) => void;
}

const GoogleMapsKeyInput: React.FC<GoogleMapsKeyInputProps> = ({ onApiKeySet }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isStored, setIsStored] = useState(false);

  useEffect(() => {
    // Check if API key is already stored in localStorage
    const storedKey = localStorage.getItem('googleMapsApiKey');
    if (storedKey) {
      setApiKey(storedKey);
      setIsStored(true);
      onApiKeySet(storedKey);
    }
  }, [onApiKeySet]);

  const handleSaveKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid Google Maps API key",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem('googleMapsApiKey', apiKey);
    setIsStored(true);
    onApiKeySet(apiKey);
    toast({
      title: "Success",
      description: "Google Maps API key saved successfully!",
    });
  };

  const handleClearKey = () => {
    localStorage.removeItem('googleMapsApiKey');
    setApiKey('');
    setIsStored(false);
    onApiKeySet('');
    toast({
      title: "Info",
      description: "Google Maps API key cleared",
    });
  };

  if (isStored) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Google Maps Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Google Maps API key is configured
            </span>
            <Button variant="outline" size="sm" onClick={handleClearKey}>
              Update Key
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Google Maps Setup Required
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          To use the barangay location map, please enter your Google Maps API key. 
          <a 
            href="https://developers.google.com/maps/documentation/javascript/get-api-key" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline ml-1"
          >
            Get your API key here
          </a>
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type={showKey ? "text" : "password"}
              placeholder="Enter your Google Maps API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <Button onClick={handleSaveKey}>
            Save
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Your API key will be stored locally in your browser for this session only.
        </p>
      </CardContent>
    </Card>
  );
};

export default GoogleMapsKeyInput;
