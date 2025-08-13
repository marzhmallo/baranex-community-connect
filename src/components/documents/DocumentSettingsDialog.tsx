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
  const [gcashProvider, setGcashProvider] = useState<any>(null);
  const [cashProvider, setCashProvider] = useState<any>(null);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [cashEnabled, setCashEnabled] = useState(true);
  const [gcashEnabled, setGcashEnabled] = useState(true);
  const [requireUpfront, setRequireUpfront] = useState(false);
  const { toast } = useToast();
  const { adminProfileId } = useCurrentAdmin();

  // Fetch admin profile and payment providers from payme table
  useEffect(() => {
    const fetchData = async () => {
      if (!adminProfileId) return;

      try {
        // Fetch admin profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('brgyid')
          .eq('id', adminProfileId)
          .maybeSingle();

        if (profileError) throw profileError;
        setAdminProfile(profile);

        // Fetch providers from payme table
        if (profile?.brgyid) {
          const { data: providers, error: paymeError } = await supabase
            .from('payme')
            .select('gname, url, enabled, credz, brgyid')
            .eq('brgyid', profile.brgyid);

          if (paymeError) throw paymeError;

          const gc = providers?.find((p: any) => p.gname?.toLowerCase() === 'gcash') || null;
          const cash = providers?.find((p: any) => p.gname?.toLowerCase() === 'cash') || null;

          setGcashProvider(gc);
          setCashProvider(cash);

          // Pre-populate form if GCASH exists
          const credz = (gc?.credz as any) || {};
          if (credz.number) setGcashNumber(String(credz.number));
          if (credz.name) setGcashName(String(credz.name));

          setGcashEnabled(gc?.enabled ?? true);
          setCashEnabled(cash?.enabled ?? true);

          // Setup complete if gcash enabled and has name, number, and QR url
          const hasNumber = Boolean(credz.number);
          const hasName = Boolean(credz.name);
          const hasQR = Boolean(gc?.url);
          setIsSetupComplete(Boolean(gc ? (hasNumber && hasName && hasQR) : false));

          // Fetch barangay-level payment policy and instructions
          const { data: brgyRow, error: brgyError } = await supabase
            .from('barangays')
            .select('payreq, instructions')
            .eq('id', profile.brgyid)
            .maybeSingle();

          if (brgyError) throw brgyError;

          if (brgyRow) {
            if (brgyRow.payreq !== null) {
              setRequireUpfront(Boolean(brgyRow.payreq));
            } else {
              // Legacy fallback to localStorage if DB not yet set
              const keyBase = `docpay:${profile.brgyid}`;
              const upfront = localStorage.getItem(`${keyBase}:requireUpfront`);
              setRequireUpfront(upfront === 'true');
            }
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

  // Policies now persisted in DB (barangays.payreq). Legacy localStorage fallback handled in fetchData.
  // No separate effect needed here to avoid overriding DB values.

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
      // Persist local policy only (no DB for policies)
      const keyBase = `docpay:${adminProfile.brgyid}`;
      localStorage.setItem(`${keyBase}:requireUpfront`, String(requireUpfront));

      // Prepare GCash QR upload if provided
      const willUpdateGcash = Boolean(gcashEnabled || gcashNumber || gcashName || qrCodeFile);
      let qrCodeUrl = gcashProvider?.url || null;

      if (qrCodeFile) {
        const fileExt = qrCodeFile.name.split('.').pop();
        const fileName = `${adminProfile.brgyid}/gcash-qr.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('cashqr')
          .upload(fileName, qrCodeFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('cashqr')
          .getPublicUrl(fileName);

        qrCodeUrl = publicUrl;
      }

      // Build mutations using update-or-insert to avoid unique constraint errors
      const mutations: any[] = [];

      if (willUpdateGcash) {
        const gcashData = {
          brgyid: adminProfile.brgyid,
          gname: 'GCash',
          enabled: gcashEnabled,
          url: qrCodeUrl,
          credz: { name: gcashName || null, number: gcashNumber || null },
        };

        mutations.push(
          supabase
            .from('payme')
            .select('id')
            .eq('brgyid', adminProfile.brgyid)
            .eq('gname', 'GCash')
            .maybeSingle()
            .then(async ({ data, error }) => {
              if (error) return { error };
              if (data?.id) {
                return await supabase
                  .from('payme')
                  .update(gcashData)
                  .eq('id', data.id)
                  .select();
              } else {
                return await supabase
                  .from('payme')
                  .insert([gcashData])
                  .select();
              }
            })
        );
      }

      // Always reflect Cash toggle
      const cashData = {
        brgyid: adminProfile.brgyid,
        gname: 'Cash',
        enabled: cashEnabled,
        url: null,
        credz: {},
      };

      mutations.push(
        supabase
          .from('payme')
          .select('id')
          .eq('brgyid', adminProfile.brgyid)
          .eq('gname', 'Cash')
          .maybeSingle()
          .then(async ({ data, error }) => {
            if (error) return { error };
            if (data?.id) {
              return await supabase
                .from('payme')
                .update(cashData)
                .eq('id', data.id)
                .select();
            } else {
              return await supabase
                .from('payme')
                .insert([cashData])
                .select();
            }
          })
      );
      // Persist barangay-level policy and generated instructions
      mutations.push(
        supabase
          .from('barangays')
          .update({
            payreq: requireUpfront,
            instructions: `Payment Instructions:\n- ${instructions()}`,
          })
          .eq('id', adminProfile.brgyid)
          .select()
          .then((r) => r)
      );

      const results = await Promise.all(mutations);
      const dbError = (results as any[]).find((r: any) => r?.error)?.error;
      if (dbError) throw dbError;

      toast({
        title: "Settings Saved",
        description: "Payment providers and policies saved.",
      });

      onOpenChange(false);
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
      if (cashEnabled) steps.push("You may pay via GCash now or pay in cash upon pickup.");
      else steps.push("You may pay via GCash to proceed with your request.");
    }
    if (gcashEnabled) {
      const name = gcashName || (gcashProvider?.credz?.name ?? "");
      const number = gcashNumber || (gcashProvider?.credz?.number ?? "");
      if (name || number) {
        steps.push(`GCash: Send the exact amount to ${name}${number ? ` (${number})` : ''}.`);
      }
      if (gcashProvider?.url) {
        steps.push("Scan the GCash QR code provided to pay quickly.");
      }
    }
    steps.push("If paying via GCash, upload your payment screenshot and reference number in the request form.");
    if (cashEnabled) {
      steps.push("If paying in cash, choose Walk‑in Payment and settle at the office upon pickup.");
    }
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

  const hasExistingQR = Boolean(gcashProvider?.url);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Document Payments Setup</DialogTitle>
        </DialogHeader>

        {/* Status */}
        <div className="space-y-4 py-2">
          {gcashProvider && (
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
            {/* GCash Toggle */}
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Enable GCash</p>
                <p className="text-xs text-muted-foreground">Toggle availability of GCash as a payment method.</p>
              </div>
              <Switch checked={gcashEnabled} onCheckedChange={setGcashEnabled} />
            </div>

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
                disabled={!gcashEnabled}
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
                disabled={!gcashEnabled}
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
                  disabled={!gcashEnabled}
                />
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
              {qrCodeFile && (
                <p className="text-sm text-muted-foreground">Selected: {qrCodeFile.name}</p>
              )}
              {gcashProvider?.url && !qrCodeFile && (
                <div className="mt-2">
                  <img
                    src={gcashProvider.url}
                    alt="GCash QR code"
                    className="w-32 h-32 object-contain border rounded"
                    loading="lazy"
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
