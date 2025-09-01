import React, { useState } from 'react';
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
}

export const BarangaySelectionModal: React.FC<BarangaySelectionModalProps> = ({
  isOpen,
  onClose,
  contentType
}) => {
  const [selectedBarangay, setSelectedBarangay] = useState<string>('');
  const navigate = useNavigate();

  // Get all barangays using the security definer function
  const { data: barangays, isLoading: barangaysLoading } = useQuery({
    queryKey: ['barangays'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_barangay_list' as any);
      
      if (error) throw error;
      return data as { id: string; barangayname: string }[];
    }
  });

  const handleProceed = () => {
    if (!selectedBarangay) return;

    const selectedBarangayData = barangays?.find(b => b.id === selectedBarangay);
    if (!selectedBarangayData) return;

    // Save selection to localStorage (limited data available)
    localStorage.setItem('selectedBarangay', JSON.stringify({
      id: selectedBarangayData.id,
      name: selectedBarangayData.barangayname,
      municipality: 'Unknown', // Not available from function
      province: 'Unknown' // Not available from function
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
            <label className="text-sm font-medium">Barangay</label>
            <Select 
              value={selectedBarangay} 
              onValueChange={setSelectedBarangay}
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