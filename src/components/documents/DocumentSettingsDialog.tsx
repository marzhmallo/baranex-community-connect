import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentAdmin } from "@/hooks/useCurrentAdmin";
import { Upload, Save, Copy } from "lucide-react";

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
  const [cashEnabled, setCashEnabled] = useState(true);
  const [requireUpfront, setRequireUpfront] = useState(false);
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

  // Load local (per-barangay) policies from localStorage when dialog opens
  useEffect(() => {
    if (open && adminProfile?.brgyid) {
      const keyBase = `docpay:${adminProfile.brgyid}`;
      const cash = localStorage.getItem(`${keyBase}:cashEnabled`);
      const upfront = localStorage.getItem(`${keyBase}:requireUpfront`);
      setCashEnabled(cash === null ? true : cash === 'true');
      setRequireUpfront(upfront === 'true');
    }
  }, [open, adminProfile?.brgyid]);

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

    setLoading(true);
    try {
      // Persist local policies (no DB changes)
      const keyBase = `docpay:${adminProfile.brgyid}`;
      localStorage.setItem(`${keyBase}:cashEnabled`, String(cashEnabled));
      localStorage.setItem(`${keyBase}:requireUpfront`, String(requireUpfront));

      // Only update GCash info in DB if provided
      const willUpdateGcash = Boolean((gcashNumber && gcashName) || qrCodeFile);
      if (willUpdateGcash) {
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
          'gcash#': gcashNumber ? parseInt(gcashNumber) : undefined,
          gcashname: gcashName ? [gcashName] : undefined,
          updated_at: new Date().toISOString()
        };

        // Only update QR URL if we have one
        if (qrCodeUrl) {
          updateData.gcashurl = qrCodeUrl;
        }

        // Remove undefined keys
        Object.keys(updateData).forEach((k) => updateData[k] === undefined && delete updateData[k]);

        const { error } = await supabase
          .from('barangays')
          .update(updateData)
          .eq('id', adminProfile.brgyid);

        if (error) throw error;
      }

      toast({
        title: "Settings Saved",
        description: willUpdateGcash
          ? "Payment providers and GCash details have been saved."
          : "Payment policies have been saved.",
      });

      onOpenChange(false);

      // Reset file input only (keep text for convenience next time)
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

  const instructions = () => {
    const steps: string[] = [];
    if (requireUpfront) {
      steps.push("This barangay requires upfront payment for online requests.");
    } else {
      steps.push("You may pay via GCash now or pay in cash upon pickup.");
    }
    if (gcashNumber || existingGcashData?.["gcash#"]) {
      const number = gcashNumber || existingGcashData?.["gcash#"]; 
      const name = gcashName || existingGcashData?.gcashname?.[0] || "";
      steps.push(`GCash: Send the exact amount to ${name}${number ? ` (${number})` : ''}.`);
    }
    if (existingGcashData?.gcashurl) {
      steps.push("Scan the GCash QR code provided to pay quickly.");
    }
    steps.push("If paying via GCash, upload your payment screenshot and reference number in the request form.");
    steps.push("If paying in cash, choose Walk‑in Payment and settle at the office upon pickup.");
    return steps.join("\n- ");
  };

  const copyInstructions = async () => {
    try {
      await navigator.clipboard.writeText(`Payment Instructions:\n- ${instructions()}`);
      toast({ title: "Copied", description: "Instructions copied to clipboard" });
    } catch {
      toast({ title: "Copy failed", description: "Please try again", variant: "destructive" });
    }
  };

  const hasExistingQR = Boolean(existingGcashData?.gcashurl);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Document Payments Setup</DialogTitle>
        </DialogHeader>

        {/* Status */}
        <div className="space-y-4 py-2">
          {existingGcashData && (
            <div
              className={`p-3 rounded-lg border ${
                isSetupComplete
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isSetupComplete ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <span
                  className={`text-sm font-medium ${
                    isSetupComplete ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'
                  }`}
                >
                  {isSetupComplete ? 'GCash Setup Complete' : 'GCash Setup Incomplete'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isSetupComplete
                  ? 'All GCash payment information has been configured.'
                  : 'Some GCash information is missing. Please complete the setup below.'}
              </p>
              {hasExistingQR && (
                <p className="text-xs text-muted-foreground mt-1">QR Code: Already uploaded</p>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="providers" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="providers">Providers</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="space-y-5 pt-4">
            {/* GCash Config */}
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
                <p className="text-sm text-muted-foreground">Selected: {qrCodeFile.name}</p>
              )}
              {existingGcashData?.gcashurl && !qrCodeFile && (
                <div className="mt-2">
                  <img
                    src={existingGcashData.gcashurl}
                    alt="GCash QR"
                    className="w-32 h-32 object-contain border rounded"
                  />
                </div>
              )}
            </div>

            {/* Cash on Pickup */}
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Cash on Pickup</p>
                <p className="text-xs text-muted-foreground">Allow residents to pay at the barangay office when claiming documents.</p>
              </div>
              <Switch checked={cashEnabled} onCheckedChange={setCashEnabled} />
            </div>
          </TabsContent>

          <TabsContent value="policies" className="space-y-5 pt-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Require upfront payment</p>
                <p className="text-xs text-muted-foreground">When enabled, users must select GCash and upload proof of payment for online requests.</p>
              </div>
              <Switch checked={requireUpfront} onCheckedChange={setRequireUpfront} />
            </div>

            <p className="text-xs text-muted-foreground">
              Note: Pricing is per-document and should be managed in the Document Types library.
            </p>
          </TabsContent>

          <TabsContent value="instructions" className="space-y-3 pt-4">
            <div className="rounded-lg border border-border p-3 bg-muted/20">
              <p className="text-sm font-medium mb-2 text-foreground">Preview Instructions</p>
              <pre className="whitespace-pre-wrap text-xs text-muted-foreground">
{`Payment Instructions:
- ${instructions()}`}
              </pre>
              <div className="flex justify-end mt-2">
                <Button type="button" variant="outline" onClick={copyInstructions}>
                  <Copy className="h-4 w-4 mr-2" /> Copy
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="border-border text-foreground hover:bg-accent"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentSettingsDialog;
