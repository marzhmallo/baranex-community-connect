import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BarangaySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: 'announcements' | 'events' | 'officials' | 'emergency' | 'forum';
}

interface Barangay {
  id: string;
  barangayname: string;
  municipality: string;
  province: string;
  logo_url?: string;
  backgroundurl?: string;
  halllat?: number;
  halllong?: number;
  phone?: string;
  email?: string;
  officehours?: string;
  instructions?: string;
  gcashname?: string[];
  gcashurl?: string;
}

export const BarangaySelectionModal: React.FC<BarangaySelectionModalProps> = ({
  isOpen,
  onClose,
  contentType
}) => {
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('');
  const [selectedBarangay, setSelectedBarangay] = useState<string>('');
  const navigate = useNavigate();

  // Get municipalities
  const { data: municipalities, isLoading: municipalitiesLoading } = useQuery({
    queryKey: ['municipalities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_public_barangay_data' as any);
      
      if (error) throw error;
      
      // Get unique municipalities
      const barangayData = data as Barangay[];
      const uniqueMunicipalities = [...new Set(barangayData.map(item => item.municipality))];
      return uniqueMunicipalities.sort();
    }
  });

  // Get barangays for selected municipality
  const { data: barangays, isLoading: barangaysLoading } = useQuery({
    queryKey: ['barangays', selectedMunicipality],
    queryFn: async () => {
      if (!selectedMunicipality) return [];
      
      const { data, error } = await supabase
        .rpc('get_public_barangay_data' as any);
      
      if (error) throw error;
      
      const barangayData = data as Barangay[];
      return barangayData
        .filter(barangay => barangay.municipality === selectedMunicipality)
        .sort((a, b) => a.barangayname.localeCompare(b.barangayname));
    },
    enabled: !!selectedMunicipality
  });

  // Reset barangay selection when municipality changes
  useEffect(() => {
    setSelectedBarangay('');
  }, [selectedMunicipality]);

  const handleProceed = () => {
    if (!selectedBarangay) return;

    const selectedBarangayData = barangays?.find(b => b.id === selectedBarangay);
    if (!selectedBarangayData) return;

    // Save selection to localStorage
    localStorage.setItem('selectedBarangay', JSON.stringify({
      id: selectedBarangayData.id,
      name: selectedBarangayData.barangayname,
      municipality: selectedBarangayData.municipality,
      province: selectedBarangayData.province
    }));

    // Navigate to the selected content page
    navigate(`/public/${contentType}?barangay=${selectedBarangayData.id}`);
    onClose();
  };

  const getContentLabel = () => {
    switch (contentType) {
      case 'announcements':
        return 'Announcements';
      case 'events':
        return 'Events';
      case 'officials':
        return 'Officials';
      case 'emergency':
        return 'Emergency Services';
      case 'forum':
        return 'Community Forum';
      default:
        return 'Content';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Your Barangay</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Municipality/City</label>
            <Select value={selectedMunicipality} onValueChange={setSelectedMunicipality}>
              <SelectTrigger>
                <SelectValue placeholder="Select Municipality/City" />
              </SelectTrigger>
              <SelectContent>
                {municipalitiesLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  municipalities?.map((municipality) => (
                    <SelectItem key={municipality} value={municipality}>
                      {municipality}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Barangay</label>
            <Select 
              value={selectedBarangay} 
              onValueChange={setSelectedBarangay}
              disabled={!selectedMunicipality}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Barangay" />
              </SelectTrigger>
              <SelectContent>
                {barangaysLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  barangays?.map((barangay) => (
                    <SelectItem key={barangay.id} value={barangay.id}>
                      {barangay.barangayname}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleProceed} 
            className="w-full" 
            disabled={!selectedBarangay}
          >
            View {getContentLabel()}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};