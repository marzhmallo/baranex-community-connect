import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { X, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
interface DocumentRequestModalProps {
  onClose: () => void;
}
const DocumentRequestModal = ({
  onClose
}: DocumentRequestModalProps) => {
  const {
    userProfile
  } = useAuth();
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();
  const [selectedDocumentType, setSelectedDocumentType] = useState("");
  const [purpose, setPurpose] = useState("");
  const [receiverType, setReceiverType] = useState("self"); // "self" or "other"
  const [receiverName, setReceiverName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("walk-in");
  const [amount, setAmount] = useState("");
  const [orNumber, setOrNumber] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch barangay GCash info
  const {
    data: barangayInfo = null
  } = useQuery({
    queryKey: ['barangay-info', userProfile?.brgyid],
    queryFn: async () => {
      if (!userProfile?.brgyid) return null;
      const {
        data,
        error
      } = await supabase.from('barangays').select('"gcash#", gcashname, gcashurl').eq('id', userProfile.brgyid).single();
      if (error) throw error;
      return data;
    },
    enabled: !!userProfile?.brgyid
  });

  // Check if GCash is available for the barangay
  const isGCashAvailable = barangayInfo && (
    barangayInfo["gcash#"] || 
    (barangayInfo.gcashname && barangayInfo.gcashname.length > 0) ||
    barangayInfo.gcashurl
  );

  // Reset payment method to walk-in if GCash becomes unavailable
  useEffect(() => {
    if (paymentMethod === "gcash" && !isGCashAvailable) {
      setPaymentMethod("walk-in");
    }
  }, [isGCashAvailable, paymentMethod]);

  // Fetch available document types
  const {
    data: documentTypes = [],
    isLoading: isLoadingTypes
  } = useQuery({
    queryKey: ['document-types', userProfile?.brgyid],
    queryFn: async () => {
      console.log('Fetching document types for brgyid:', userProfile?.brgyid);
      console.log('UserProfile:', userProfile);
      if (!userProfile?.brgyid) {
        console.log('No brgyid found, returning empty array');
        return [];
      }
      const {
        data,
        error
      } = await supabase.from('document_types').select('*');
      console.log('Document types query result:', {
        data,
        error
      });
      if (error) {
        console.error('Error fetching document types:', error);
        throw error;
      }
      return data || [];
    },
    enabled: !!userProfile?.brgyid
  });
  const selectedDoc = documentTypes.find(doc => doc.id === selectedDocumentType);
  const createDocumentRequest = useMutation({
    mutationFn: async (requestData: any) => {
      const {
        data,
        error
      } = await supabase.from('docrequests').insert([requestData]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Document request submitted successfully"
      });
      queryClient.invalidateQueries({
        queryKey: ['user-document-requests']
      });
      onClose();
    },
    onError: error => {
      console.error('Error creating document request:', error);
      toast({
        title: "Error",
        description: "Failed to submit document request",
        variant: "destructive"
      });
    }
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !selectedDocumentType || !purpose) return;
    setIsSubmitting(true);
    try {
      let paymentUrl = null;

      // Upload payment screenshot to Supabase storage if provided
      if (paymentMethod === "gcash" && paymentScreenshot) {
        const fileName = `${userProfile.id}/payment_${Date.now()}_${paymentScreenshot.name}`;
        const {
          data: uploadData,
          error: uploadError
        } = await supabase.storage.from('cashg').upload(fileName, paymentScreenshot);
        if (uploadError) {
          console.error('Error uploading payment screenshot:', uploadError);
          toast({
            title: "Upload Error",
            description: "Failed to upload payment screenshot",
            variant: "destructive"
          });
          return;
        }

        // Get the public URL for the uploaded file
        const {
          data: {
            publicUrl
          }
        } = supabase.storage.from('cashg').getPublicUrl(fileName);
        paymentUrl = publicUrl;
      }
      const receiver = receiverType === "self" ? {
        id: userProfile.id,
        name: `${userProfile.firstname} ${userProfile.lastname}`
      } : {
        name: receiverName
      };
      const requestData = {
        type: selectedDoc?.name,
        purpose,
        resident_id: userProfile.id,
        brgyid: userProfile.brgyid,
        receiver,
        method: paymentMethod,
        amount: selectedDoc?.fee || 0,
        ...(paymentMethod === "gcash" && {
          ornumber: orNumber,
          paymenturl: paymentUrl,
          paydate: new Date().toISOString()
        }),
        status: 'Request',
        issued_at: new Date().toISOString()
      };
      await createDocumentRequest.mutateAsync(requestData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  return <div className="fixed inset-0 z-50 overflow-auto bg-black/50 dark:bg-black/70 flex items-center justify-center p-4">
      <div className="bg-background rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-border">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="text-xl font-semibold text-foreground">Request Document</h2>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Document Type Selection */}
            <div>
              <Label htmlFor="documentType" className="text-sm font-medium text-foreground">
                Document Type * 
                
              </Label>
              <Select value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder={isLoadingTypes ? "Loading document types..." : documentTypes.length === 0 ? "No document types available" : "Select document type..."} />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map(docType => <SelectItem key={docType.id} value={docType.id}>
                      <div className="flex justify-between items-center w-full">
                        <span>{docType.name}</span>
                        {docType.fee > 0 && <span className="text-sm text-muted-foreground ml-2">₱{docType.fee}</span>}
                      </div>
                    </SelectItem>)}
                </SelectContent>
              </Select>
              {selectedDoc?.description && <p className="text-sm text-muted-foreground mt-1">{selectedDoc.description}</p>}
            </div>

            {/* Purpose */}
            <div>
              <Label htmlFor="purpose" className="text-sm font-medium text-foreground">
                Purpose *
              </Label>
              <Textarea id="purpose" value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="Enter the purpose for this document..." className="mt-1" rows={3} />
            </div>

            {/* Receiver */}
            <div>
              <Label className="text-sm font-medium text-foreground">
                Document Recipient *
              </Label>
              <RadioGroup value={receiverType} onValueChange={setReceiverType} className="mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="self" id="self" />
                  <Label htmlFor="self">For myself</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other">For someone else</Label>
                </div>
              </RadioGroup>
              
              {receiverType === "other" && <div className="mt-3">
                  <Label htmlFor="receiverName" className="text-sm font-medium text-foreground">
                    Recipient's Full Name *
                  </Label>
                  <Input id="receiverName" value={receiverName} onChange={e => setReceiverName(e.target.value)} placeholder="Enter recipient's full name..." className="mt-1" />
                </div>}
            </div>

            {/* Payment Method */}
            {selectedDoc?.fee > 0 && <div>
                <Label className="text-sm font-medium text-foreground">
                  Payment Method *
                </Label>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="walk-in" id="walk-in" />
                    <Label htmlFor="walk-in">Walk-in Payment (Cash)</Label>
                  </div>
                  <div className={`flex items-center space-x-2 ${!isGCashAvailable ? 'opacity-50' : ''}`}>
                    <RadioGroupItem value="gcash" id="gcash" disabled={!isGCashAvailable} />
                    <Label htmlFor="gcash" className={!isGCashAvailable ? 'cursor-not-allowed' : ''}>
                      GCash Payment
                      {!isGCashAvailable && <span className="text-xs text-destructive ml-2">(Not available - GCash not set up)</span>}
                    </Label>
                  </div>
                </RadioGroup>

                {paymentMethod === "gcash" && <div className="mt-4 space-y-4 p-4 bg-muted/20 rounded-lg">
                    {/* Barangay GCash Information */}
                    {barangayInfo && <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                        <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">Send Payment To:</h4>
                        <div className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                          {barangayInfo["gcash#"] && <p><span className="font-medium">GCash Number:</span> {barangayInfo["gcash#"]}</p>}
                          {barangayInfo.gcashname && barangayInfo.gcashname.length > 0 && <p><span className="font-medium">GCash Name:</span> {barangayInfo.gcashname.join(", ")}</p>}
                          {barangayInfo.gcashurl && <div className="mt-2">
                              <p className="font-medium mb-1">GCash QR Code:</p>
                              <img src={barangayInfo.gcashurl} alt="GCash QR Code" className="w-32 h-32 object-contain border rounded" />
                            </div>}
                        </div>
                      </div>}

                    <div>
                      <Label htmlFor="amount" className="text-sm font-medium text-foreground">
                        Amount *
                      </Label>
                      <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder={`₱${selectedDoc.fee}`} className="mt-1" />
                    </div>
                    
                    <div>
                      <Label htmlFor="orNumber" className="text-sm font-medium text-foreground">
                        GCash Reference Number *
                      </Label>
                      <Input id="orNumber" value={orNumber} onChange={e => setOrNumber(e.target.value)} placeholder="Enter GCash reference number..." className="mt-1" />
                    </div>
                    
                    <div>
                      <Label htmlFor="paymentScreenshot" className="text-sm font-medium text-foreground">
                        Payment Screenshot *
                      </Label>
                      <div className="mt-1">
                        <input id="paymentScreenshot" type="file" accept="image/*" onChange={e => setPaymentScreenshot(e.target.files?.[0] || null)} className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/20 file:text-primary hover:file:bg-primary/30" />
                        {paymentScreenshot && <div className="mt-2">
                            <img src={URL.createObjectURL(paymentScreenshot)} alt="Payment screenshot preview" className="w-32 h-32 object-cover border rounded" />
                          </div>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Upload a screenshot of your GCash payment</p>
                    </div>
                  </div>}
              </div>}
          </div>

          <div className="p-6 border-t border-border flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedDocumentType || !purpose || receiverType === "other" && !receiverName || paymentMethod === "gcash" && selectedDoc?.fee > 0 && (!amount || !orNumber || !paymentScreenshot)}>
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </div>
    </div>;
};
export default DocumentRequestModal;