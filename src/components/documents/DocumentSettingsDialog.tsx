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
  const { toast } = useToast();
  const { adminProfileId } = useCurrentAdmin();

  // Fetch admin profile data
  useEffect(() => {
    const fetchAdminProfile = async () => {
      if (!adminProfileId) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('brgyid')
          .eq('id', adminProfileId)
          .single();
          
        if (error) throw error;
        setAdminProfile(data);
      } catch (error) {
        console.error('Error fetching admin profile:', error);
      }
    };

    fetchAdminProfile();
  }, [adminProfileId]);

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
      let qrCodeUrl = null;

      // Upload QR code image if provided
      if (qrCodeFile) {
        const fileExt = qrCodeFile.name.split('.').pop();
        const fileName = `${adminProfile.brgyid}/gcash-qr.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('cashg')
          .upload(fileName, qrCodeFile, {
            upsert: true,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('cashg')
          .getPublicUrl(fileName);
        
        qrCodeUrl = publicUrl;
      }

      // Update barangay information
      const { error } = await supabase
        .from('barangays')
        .update({
          'gcash#': parseInt(gcashNumber),
          gcashname: [gcashName],
          gcashurl: qrCodeUrl,
          updated_at: new Date().toISOString()
        })
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