
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AddressAutoFillSetting = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSetting = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'auto_fill_address_from_admin_barangay')
          .single();

        if (error) throw error;
        setIsEnabled(data?.value === 'true');
      } catch (error) {
        console.error('Error fetching setting:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSetting();
  }, []);

  const handleToggle = async (enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('settings')
        .update({ value: enabled.toString() })
        .eq('key', 'auto_fill_address_from_admin_barangay');

      if (error) throw error;

      setIsEnabled(enabled);
      toast({
        title: "Setting updated",
        description: `Address auto-fill has been ${enabled ? 'enabled' : 'disabled'}.`,
      });
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({
        title: "Error",
        description: "Failed to update setting.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Address Auto-Fill</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="auto-fill-address">Auto-fill address fields</Label>
            <p className="text-sm text-muted-foreground">
              Automatically populate address fields based on admin's barangay when adding residents and households
            </p>
          </div>
          <Switch 
            id="auto-fill-address" 
            checked={isEnabled}
            onCheckedChange={handleToggle}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default AddressAutoFillSetting;
