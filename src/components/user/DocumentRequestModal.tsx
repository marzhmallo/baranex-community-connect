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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Upload, FileText, User, CreditCard, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocumentRequestModalProps {
  onClose: () => void;
}

const DocumentRequestModal = ({ onClose }: DocumentRequestModalProps) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDocumentType, setSelectedDocumentType] = useState("");
  const [purpose, setPurpose] = useState("");
  const [receiverType, setReceiverType] = useState("self"); 
  const [receiverName, setReceiverName] = useState("");
  const [receiverEmail, setReceiverEmail] = useState("");
  const [receiverContact, setReceiverContact] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [amount, setAmount] = useState("");
  const [orNumber, setOrNumber] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requireUpfront, setRequireUpfront] = useState(false);

  // Fetch payment methods from payme table
  const { data: paymentMethods = [], isLoading: isLoadingPaymentMethods } = useQuery({
    queryKey: ['payment-methods', userProfile?.brgyid],
    queryFn: async () => {
      if (!userProfile?.brgyid) return [];
      const { data, error } = await supabase
        .from('payme')
        .select('*')
        .eq('brgyid', userProfile.brgyid)
        .eq('enabled', true)
        .order('gname');
      if (error) throw error;
      return data || [];
    },
    enabled: !!userProfile?.brgyid
  });

  // Set default payment method when payment methods load
  useEffect(() => {
    if (!paymentMethod) {
      // Set cash/walk-in as default if available
      setPaymentMethod('cash');
    }
  }, [paymentMethod]);

  // Fetch barangay payment requirement setting
  const { data: barangayInfo = null } = useQuery({
    queryKey: ['barangay-info', userProfile?.brgyid],
    queryFn: async () => {
      if (!userProfile?.brgyid) return null;
      const { data, error } = await supabase
        .from('barangays')
        .select('"gcash#", gcashname, gcashurl, payreq')
        .eq('id', userProfile.brgyid)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userProfile?.brgyid
  });

  // Load per-barangay payment policy
  useEffect(() => {
    if (userProfile?.brgyid) {
      const keyBase = `docpay:${userProfile.brgyid}`;
      const upfront = localStorage.getItem(`${keyBase}:requireUpfront`);
      setRequireUpfront(upfront === 'true');
    }
  }, [userProfile?.brgyid]);

  // Fetch available document types
  const { data: documentTypes = [], isLoading: isLoadingTypes } = useQuery({
    queryKey: ['document-types', userProfile?.brgyid],
    queryFn: async () => {
      if (!userProfile?.brgyid) return [];
      const { data, error } = await supabase.from('document_types').select('*');
      if (error) throw error;
      return data || [];
    },
    enabled: !!userProfile?.brgyid
  });

  const selectedDoc = documentTypes.find(doc => doc.id === selectedDocumentType);
  const selectedPaymentMethod = paymentMethods.find(pm => pm.id === paymentMethod);

  const createDocumentRequest = useMutation({
    mutationFn: async (requestData: any) => {
      const { data, error } = await supabase
        .from('docrequests')
        .insert([requestData])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Document request submitted successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['user-document-requests'] });
      onClose();
    },
    onError: (error) => {
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

      // Upload payment screenshot if provided
      if (selectedPaymentMethod?.gname?.toLowerCase().includes('gcash') && paymentScreenshot) {
        const fileName = `${userProfile.id}/payment_${Date.now()}_${paymentScreenshot.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('cashg')
          .upload(fileName, paymentScreenshot);
        
        if (uploadError) {
          console.error('Error uploading payment screenshot:', uploadError);
          toast({
            title: "Upload Error",
            description: "Failed to upload payment screenshot",
            variant: "destructive"
          });
          return;
        }

        const { data: { publicUrl } } = supabase.storage.from('cashg').getPublicUrl(fileName);
        paymentUrl = publicUrl;
      }

      const receiver = receiverType === "self" 
        ? {
            id: userProfile.id,
            name: `${userProfile.firstname} ${userProfile.lastname}`,
            email: userProfile.email,
            contact: userProfile.phone || 'N/A'
          }
        : { 
            name: receiverName,
            email: receiverEmail,
            contact: receiverContact
          };

      const requestData = {
        type: selectedDoc?.name,
        purpose,
        resident_id: userProfile.id,
        brgyid: userProfile.brgyid,
        receiver,
        method: paymentMethod === 'cash' ? 'Cash (Walk-in)' : selectedPaymentMethod?.gname || 'walk-in',
        amount: selectedDoc?.fee || 0,
        ...(selectedPaymentMethod?.gname?.toLowerCase().includes('gcash') && {
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

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col border border-border/50 animate-scale-in">
        {/* Header */}
        <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Request Document</h2>
                <p className="text-sm text-muted-foreground">Submit your document request with ease</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-10 w-10 p-0 hover:bg-destructive/10 hover:text-destructive rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-auto">
          <div className="p-6 space-y-8">
            {/* Document Type Selection */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-background to-muted/20">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  Document Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="documentType" className="text-sm font-medium text-foreground flex items-center gap-2">
                    Document Type <span className="text-destructive">*</span>
                  </Label>
                  <Select value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
                    <SelectTrigger className="w-full mt-2 h-12 border-2 hover:border-primary/50 transition-colors">
                      <SelectValue placeholder={
                        isLoadingTypes 
                          ? "Loading document types..." 
                          : documentTypes.length === 0 
                            ? "No document types available" 
                            : "Select document type..."
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map(docType => (
                        <SelectItem key={docType.id} value={docType.id} className="py-3">
                          <div className="flex justify-between items-center w-full">
                            <span className="font-medium">{docType.name}</span>
                            {docType.fee > 0 && (
                              <Badge variant="secondary" className="ml-2">
                                ₱{docType.fee}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedDoc?.description && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg border-l-4 border-primary">
                      <p className="text-sm text-muted-foreground">{selectedDoc.description}</p>
                      {selectedDoc.fee > 0 && (
                        <p className="text-sm font-medium text-primary mt-1">Fee: ₱{selectedDoc.fee}</p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="purpose" className="text-sm font-medium text-foreground flex items-center gap-2">
                    Purpose <span className="text-destructive">*</span>
                  </Label>
                  <Textarea 
                    id="purpose" 
                    value={purpose} 
                    onChange={(e) => setPurpose(e.target.value)} 
                    placeholder="Enter the purpose for this document..." 
                    className="mt-2 min-h-[100px] border-2 hover:border-primary/50 transition-colors resize-none" 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Recipient Information */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-background to-muted/20">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-primary" />
                  Recipient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                    Document Recipient <span className="text-destructive">*</span>
                  </Label>
                  <RadioGroup value={receiverType} onValueChange={setReceiverType} className="mt-3 space-y-3">
                    <div className="flex items-center space-x-3 p-3 rounded-lg border-2 border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all">
                      <RadioGroupItem value="self" id="self" className="border-2" />
                      <Label htmlFor="self" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="font-medium">For myself</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Document will be issued to {userProfile?.firstname} {userProfile?.lastname}
                          <br />
                          Email: {userProfile?.email}
                          <br />
                          Contact: {userProfile?.phone || 'Not provided'}
                        </p>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg border-2 border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all">
                      <RadioGroupItem value="other" id="other" className="border-2" />
                      <Label htmlFor="other" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                          <span className="font-medium">For someone else</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Specify the recipient's full name
                        </p>
                      </Label>
                    </div>
                  </RadioGroup>
                  
                  {receiverType === "other" && (
                    <div className="mt-4 space-y-4 animate-fade-in">
                      <div>
                        <Label htmlFor="receiverName" className="text-sm font-medium text-foreground flex items-center gap-2">
                          Recipient's Full Name <span className="text-destructive">*</span>
                        </Label>
                        <Input 
                          id="receiverName" 
                          value={receiverName} 
                          onChange={(e) => setReceiverName(e.target.value)} 
                          placeholder="Enter recipient's full name..." 
                          className="mt-2 h-12 border-2 hover:border-primary/50 transition-colors" 
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="receiverEmail" className="text-sm font-medium text-foreground flex items-center gap-2">
                          Recipient's Email Address <span className="text-destructive">*</span>
                        </Label>
                        <Input 
                          id="receiverEmail" 
                          type="email"
                          value={receiverEmail} 
                          onChange={(e) => setReceiverEmail(e.target.value)} 
                          placeholder="Enter recipient's email address..." 
                          className="mt-2 h-12 border-2 hover:border-primary/50 transition-colors" 
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="receiverContact" className="text-sm font-medium text-foreground flex items-center gap-2">
                          Recipient's Contact Number <span className="text-destructive">*</span>
                        </Label>
                        <Input 
                          id="receiverContact" 
                          value={receiverContact} 
                          onChange={(e) => setReceiverContact(e.target.value)} 
                          placeholder="Enter recipient's contact number..." 
                          className="mt-2 h-12 border-2 hover:border-primary/50 transition-colors" 
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            {selectedDoc?.fee > 0 && (
              <Card className="border-0 shadow-sm bg-gradient-to-br from-background to-muted/20">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                      Payment Method <span className="text-destructive">*</span>
                    </Label>
                    {isLoadingPaymentMethods ? (
                      <div className="mt-3 p-4 text-center text-muted-foreground">
                        Loading payment methods...
                      </div>
                    ) : paymentMethods.length === 0 ? (
                      <div className="mt-3 p-4 text-center text-muted-foreground bg-muted/50 rounded-lg">
                        No payment methods configured
                      </div>
                     ) : (
                       <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="mt-3 space-y-3">
                         {/* Default Cash/Walk-in Payment Option */}
                         <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all ${barangayInfo?.payreq ? 'opacity-50 cursor-not-allowed' : ''}`}>
                           <RadioGroupItem 
                             value="cash" 
                             id="cash" 
                             className="border-2" 
                             disabled={barangayInfo?.payreq}
                           />
                           <Label htmlFor="cash" className={`flex-1 ${!barangayInfo?.payreq ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                             <div className="flex items-center justify-between">
                               <div>
                                 <span className="font-medium">Cash Payment (Walk-in)</span>
                                 <p className="text-xs text-muted-foreground mt-1">
                                   {barangayInfo?.payreq ? 'Advance payment required' : 'Pay in person at the barangay office'}
                                 </p>
                               </div>
                               <div className="w-8 h-8 flex items-center justify-center bg-green-100 dark:bg-green-900/30 rounded">
                                 <span className="text-green-600 dark:text-green-400 text-lg">💰</span>
                               </div>
                             </div>
                           </Label>
                         </div>

                         {/* Online Payment Methods */}
                         {paymentMethods.map((method) => (
                           <div key={method.id} className="flex items-center space-x-3 p-4 rounded-lg border-2 border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all">
                             <RadioGroupItem value={method.id} id={method.id} className="border-2" />
                             <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                               <div className="flex items-center justify-between">
                                 <div>
                                   <span className="font-medium">{method.gname}</span>
                                   {method.credz && (
                                     <p className="text-xs text-muted-foreground mt-1">
                                       {method.gname?.toLowerCase().includes('gcash') ? 'Digital Payment' : 'Traditional Payment'}
                                     </p>
                                   )}
                                 </div>
                                 {method.url && (
                                   <img src={method.url} alt={method.gname} className="w-8 h-8 object-contain rounded" />
                                 )}
                               </div>
                             </Label>
                           </div>
                         ))}
                       </RadioGroup>
                    )}

                    {selectedPaymentMethod?.gname?.toLowerCase().includes('gcash') && (
                      <div className="mt-6 space-y-4 p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 animate-fade-in">
                        <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2">
                          <CreditCard className="h-5 w-5" />
                          GCash Payment Details
                        </h4>
                        
                        {/* Payment Information Display */}
                        {selectedPaymentMethod.credz && (
                          <div className="bg-white/50 dark:bg-black/20 p-4 rounded-lg space-y-2">
                            {typeof selectedPaymentMethod.credz === 'object' && selectedPaymentMethod.credz !== null && (
                              Object.entries(selectedPaymentMethod.credz as Record<string, any>).map(([key, value]) => (
                                <p key={key} className="text-sm">
                                  <span className="font-medium text-blue-700 dark:text-blue-300 capitalize">{key}:</span>
                                  <span className="ml-2 text-blue-600 dark:text-blue-400">{String(value)}</span>
                                </p>
                              ))
                            )}
                            {selectedPaymentMethod.url && (
                              <div className="mt-3">
                                <p className="font-medium text-blue-700 dark:text-blue-300 mb-2">QR Code:</p>
                                <img src={selectedPaymentMethod.url} alt="Payment QR Code" className="w-32 h-32 object-contain border rounded-lg bg-white" />
                              </div>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="amount" className="text-sm font-medium text-blue-800 dark:text-blue-200">
                              Amount *
                            </Label>
                            <Input 
                              id="amount" 
                              type="number" 
                              value={amount} 
                              onChange={(e) => setAmount(e.target.value)} 
                              placeholder={`₱${selectedDoc.fee}`} 
                              className="mt-1 bg-white/70 dark:bg-black/20 border-blue-200 dark:border-blue-700" 
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="orNumber" className="text-sm font-medium text-blue-800 dark:text-blue-200">
                              Reference Number *
                            </Label>
                            <Input 
                              id="orNumber" 
                              value={orNumber} 
                              onChange={(e) => setOrNumber(e.target.value)} 
                              placeholder="Enter reference number..." 
                              className="mt-1 bg-white/70 dark:bg-black/20 border-blue-200 dark:border-blue-700" 
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="paymentScreenshot" className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Payment Screenshot *
                          </Label>
                          <div className="mt-2">
                            <input 
                              id="paymentScreenshot" 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => setPaymentScreenshot(e.target.files?.[0] || null)} 
                              className="block w-full text-sm text-blue-700 dark:text-blue-300 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:transition-colors cursor-pointer bg-white/70 dark:bg-black/20 border border-blue-200 dark:border-blue-700 rounded-lg" 
                            />
                            {paymentScreenshot && (
                              <div className="mt-3 animate-fade-in">
                                <img 
                                  src={URL.createObjectURL(paymentScreenshot)} 
                                  alt="Payment screenshot preview" 
                                  className="w-40 h-40 object-cover border-2 border-blue-200 dark:border-blue-700 rounded-lg shadow-sm" 
                                />
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                            Upload a clear screenshot of your payment confirmation
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border bg-gradient-to-r from-muted/20 to-muted/10">
            <div className="flex justify-end gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                disabled={isSubmitting}
                className="px-6 py-2 h-11"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={
                  isSubmitting || 
                  !selectedDocumentType || 
                  !purpose || 
                  (receiverType === "other" && (!receiverName || !receiverEmail || !receiverContact)) ||
                  (selectedPaymentMethod?.gname?.toLowerCase().includes('gcash') && selectedDoc?.fee > 0 && (!amount || !orNumber || !paymentScreenshot)) ||
                  (selectedDoc?.fee > 0 && barangayInfo?.payreq && paymentMethod === 'cash')
                }
                className="px-8 py-2 h-11 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </div>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentRequestModal;