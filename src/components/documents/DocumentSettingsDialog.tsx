import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentAdmin } from "@/hooks/useCurrentAdmin";
import { Upload, Save } from "lucide-react";

interface DocumentSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DocumentSettingsDialog = ({ open, onOpenChange }: DocumentSettingsDialogProps) => {
  const [gcashNumber, setGcashNumber] = useState("");
  const [gcashName, setGcashName] = useState("");
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [existingGcashData, setExistingGcashData] = useState<any>(null);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const { toast } = useToast();
  const { adminProfileId } = useCurrentAdmin();

  // Fetch admin profile and existing GCash data
  useEffect(() => {
    const fetchData = async () => {
      if (!adminProfileId) return;
      
      try {
        // Fetch admin profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('brgyid')
          .eq('id', adminProfileId)
          .single();
          
        if (profileError) throw profileError;
        setAdminProfile(profile);

        // Fetch existing GCash data from barangays table
        if (profile?.brgyid) {
          const { data: barangayData, error: barangayError } = await supabase
            .from('barangays')
            .select('"gcash#", gcashname, gcashurl')
            .eq('id', profile.brgyid)
            .single();

          if (barangayError) throw barangayError;
          
          if (barangayData) {
            setExistingGcashData(barangayData);
            
            // Pre-populate form if data exists
            if (barangayData['gcash#']) {
              setGcashNumber(barangayData['gcash#'].toString());
            }
            if (barangayData.gcashname && Array.isArray(barangayData.gcashname) && barangayData.gcashname.length > 0) {
              setGcashName(barangayData.gcashname[0]);
            }
            
            // Check if setup is complete
            const hasNumber = !!barangayData['gcash#'];
            const hasName = !!(barangayData.gcashname && Array.isArray(barangayData.gcashname) && barangayData.gcashname.length > 0);
            const hasQR = !!barangayData.gcashurl;
            setIsSetupComplete(hasNumber && hasName && hasQR);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (open) {
      fetchData();
    }
  }, [adminProfileId, open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }
      setQrCodeFile(file);
    }
  };

  const handleSave = async () => {
    if (!adminProfile?.brgyid) {
      toast({
        title: "Error",
        description: "Admin profile not found",
        variant: "destructive",
      });
      return;
    }

    if (!gcashNumber || !gcashName) {
      toast({
        title: "Missing Information",
        description: "Please fill in GCash number and name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let qrCodeUrl = existingGcashData?.gcashurl || null;

      // Upload QR code image if provided
      if (qrCodeFile) {
        const fileExt = qrCodeFile.name.split('.').pop();
        const fileName = `${adminProfile.brgyid}/gcash-qr.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('cashqr')
          .upload(fileName, qrCodeFile, {
            upsert: true,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('cashqr')
          .getPublicUrl(fileName);
        
        qrCodeUrl = publicUrl;
      }

      // Update barangay information
      const updateData: any = {
        'gcash#': parseInt(gcashNumber),
        gcashname: [gcashName],
        updated_at: new Date().toISOString()
      };

      // Only update QR URL if we have one
      if (qrCodeUrl) {
        updateData.gcashurl = qrCodeUrl;
      }

      const { error } = await supabase
        .from('barangays')
        .update(updateData)
        .eq('id', adminProfile.brgyid);

      if (error) {
        throw error;
      }

      toast({
        title: "Settings Updated",
        description: "GCash payment method has been configured successfully",
      });

      onOpenChange(false);
      
      // Reset form
      setGcashNumber("");
      setGcashName("");
      setQrCodeFile(null);
      
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Document System Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Setup Status Indicator */}
          {existingGcashData && (
            <div className={`p-3 rounded-lg border ${isSetupComplete 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
              : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isSetupComplete ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <span className={`text-sm font-medium ${isSetupComplete 
                  ? 'text-green-700 dark:text-green-300' 
                  : 'text-yellow-700 dark:text-yellow-300'
                }`}>
                  {isSetupComplete ? 'GCash Setup Complete' : 'GCash Setup Incomplete'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isSetupComplete 
                  ? 'All GCash payment information has been configured.' 
                  : 'Some GCash information is missing. Please complete the setup below.'
                }
              </p>
              {existingGcashData.gcashurl && (
                <p className="text-xs text-muted-foreground mt-1">
                  QR Code: Already uploaded
                </p>
              )}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="gcash-number" className="text-foreground">GCash Number</Label>
            <Input
              id="gcash-number"
              type="tel"
              placeholder="09XXXXXXXXX"
              value={gcashNumber}
              onChange={(e) => setGcashNumber(e.target.value)}
              className="border-border bg-background text-foreground"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="gcash-name" className="text-foreground">GCash Account Name</Label>
            <Input
              id="gcash-name"
              type="text"
              placeholder="Juan Dela Cruz"
              value={gcashName}
              onChange={(e) => setGcashName(e.target.value)}
              className="border-border bg-background text-foreground"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="qr-code" className="text-foreground">GCash QR Code Image</Label>
            <div className="flex items-center gap-2">
              <Input
                id="qr-code"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="border-border bg-background text-foreground"
              />
              <Upload className="h-4 w-4 text-muted-foreground" />
            </div>
            {qrCodeFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {qrCodeFile.name}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="border-border text-foreground hover:bg-accent"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentSettingsDialog;