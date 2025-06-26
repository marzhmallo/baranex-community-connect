import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileCog, Save, UserCheck, X } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { addDays } from "date-fns";
import { v4 as uuidv4 } from 'uuid';

const issueDocumentSchema = z.object({
  document_type_id: z.string().uuid({
    message: "Please select a document type"
  }),
  resident_id: z.string().uuid({
    message: "Please select a resident"
  }),
  purpose: z.string().min(5, {
    message: "Purpose must be at least 5 characters"
  }),
  payment_amount: z.coerce.number().min(0, {
    message: "Payment amount cannot be negative"
  }),
  payment_status: z.string(),
  status: z.string()
});

interface IssueDocumentFormProps {
  onClose?: () => void;
}

const IssueDocumentForm = ({ onClose }: IssueDocumentFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [residents, setResidents] = useState([]);
  const [loadingDocTypes, setLoadingDocTypes] = useState(true);
  const [loadingResidents, setLoadingResidents] = useState(true);
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [dynamicFields, setDynamicFields] = useState({});
  const {
    toast
  } = useToast();

  // Set up form with default values
  const form = useForm({
    resolver: zodResolver(issueDocumentSchema),
    defaultValues: {
      document_type_id: "",
      resident_id: "",
      purpose: "",
      payment_amount: 0,
      payment_status: "pending",
      status: "issued"
    }
  });

  // Fetch document types and residents on component mount
  useEffect(() => {
    fetchDocumentTypes();
    fetchResidents();
  }, []);

  // Fetch document types from the database
  const fetchDocumentTypes = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('document_types').select('*').order('name');
      if (error) throw error;
      setDocumentTypes(data || []);
    } catch (error) {
      console.error("Error fetching document types:", error);
      toast({
        title: "Error",
        description: "Failed to load document types.",
        variant: "destructive"
      });
    } finally {
      setLoadingDocTypes(false);
    }
  };

  // Fetch residents from the database
  const fetchResidents = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('residents').select('id, first_name, last_name, middle_name, suffix').order('last_name');
      if (error) throw error;
      setResidents(data || []);
    } catch (error) {
      console.error("Error fetching residents:", error);
      toast({
        title: "Error",
        description: "Failed to load residents.",
        variant: "destructive"
      });
    } finally {
      setLoadingResidents(false);
    }
  };

  // Update selected document type and set fee
  const handleDocTypeChange = docTypeId => {
    const docType = documentTypes.find(dt => dt.id === docTypeId);
    setSelectedDocType(docType);
    form.setValue("payment_amount", docType?.fee || 0);

    // Reset dynamic fields
    setDynamicFields({});

    // Initialize dynamic fields if there are required fields
    if (docType?.required_fields && Object.keys(docType.required_fields).length > 0) {
      const initialFields = {};
      Object.keys(docType.required_fields).forEach(key => {
        initialFields[key] = "";
      });
      setDynamicFields(initialFields);
    }
  };

  // Update dynamic field value
  const handleDynamicFieldChange = (field, value) => {
    setDynamicFields(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Get resident full name
  const getResidentName = residentId => {
    const resident = residents.find(r => r.id === residentId);
    if (!resident) return "";
    const middleInitial = resident.middle_name ? ` ${resident.middle_name.charAt(0)}.` : "";
    return `${resident.first_name}${middleInitial} ${resident.last_name}${resident.suffix ? ` ${resident.suffix}` : ""}`;
  };

  // Handle form submission
  const onSubmit = async data => {
    setIsSubmitting(true);
    try {
      // Generate a unique document number
      const documentNumber = `DOC-${format(new Date(), "yyyyMMdd")}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Calculate expiry date if validity days is set
      let expiryDate = null;
      if (selectedDocType?.validity_days) {
        expiryDate = addDays(new Date(), selectedDocType.validity_days);
      }

      // Get logged in user ID (mock for now)
      const userId = uuidv4(); // In a real app, this would come from auth

      // Prepare data for insertion
      const documentData = {
        document_type_id: data.document_type_id,
        resident_id: data.resident_id,
        purpose: data.purpose,
        payment_amount: data.payment_amount,
        payment_status: data.payment_status,
        status: data.status,
        document_number: documentNumber,
        issued_by: userId,
        data: dynamicFields,
        expiry_date: expiryDate
      };

      // Insert the document
      const {
        data: newDocument,
        error
      } = await supabase.from('issued_documents').insert(documentData).select();
      if (error) throw error;

      // Log the document issuance
      const {
        error: logError
      } = await supabase.from('document_logs').insert({
        document_id: newDocument[0].id,
        action: "issued",
        performed_by: "Admin User",
        // In a real app, use the actual user name
        details: {
          document_number: documentNumber,
          document_type: selectedDocType?.name,
          resident_name: getResidentName(data.resident_id),
          ...dynamicFields
        }
      });
      if (logError) throw logError;
      toast({
        title: "Document Issued",
        description: `Document has been issued successfully with number: ${documentNumber}`
      });

      // Reset form
      form.reset();
      setSelectedDocType(null);
      setDynamicFields({});
      
      // Close the modal if onClose is provided
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("Error issuing document:", error);
      toast({
        title: "Error",
        description: "Failed to issue the document.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render loading skeleton
  if (loadingDocTypes || loadingResidents) {
    return <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>;
  }

  return (
    <div className="space-y-6">
      {onClose && (
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">Issue New Document</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <Card className="mx-[15px]">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="document_type_id" render={({
                field
              }) => <FormItem>
                      <FormLabel>Document Type</FormLabel>
                      <Select onValueChange={value => {
                  field.onChange(value);
                  handleDocTypeChange(value);
                }} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a document type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {documentTypes.map(docType => <SelectItem key={docType.id} value={docType.id}>
                              {docType.name} {docType.fee > 0 ? `(₱${docType.fee})` : ''}
                            </SelectItem>)}
                        </SelectContent>
                      </Select>
                      {selectedDocType?.description && <FormDescription>{selectedDocType.description}</FormDescription>}
                      <FormMessage />
                    </FormItem>} />
                
                <FormField control={form.control} name="resident_id" render={({
                field
              }) => <FormItem>
                      <FormLabel>Resident</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a resident" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {residents.map(resident => <SelectItem key={resident.id} value={resident.id}>
                              {resident.last_name}, {resident.first_name} {resident.middle_name ? resident.middle_name.charAt(0) + '.' : ''} {resident.suffix || ''}
                            </SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>} />
              </div>
              
              <FormField control={form.control} name="purpose" render={({
              field
            }) => <FormItem>
                    <FormLabel>Purpose</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter the purpose for this document" className="resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />
              
              {selectedDocType && Object.keys(selectedDocType.required_fields || {}).length > 0 && <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <FileCog className="h-5 w-5" />
                      <h3 className="text-lg font-medium">Document Fields</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(selectedDocType.required_fields).map(([field, type]) => <div key={field} className="space-y-2">
                          <label className="text-sm font-medium">
                            {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </label>
                          <Input type={type === 'number' ? 'number' : 'text'} value={dynamicFields[field] || ''} onChange={e => handleDynamicFieldChange(field, e.target.value)} placeholder={`Enter ${field.replace(/_/g, ' ')}`} />
                        </div>)}
                    </div>
                  </div>
                </>}
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField control={form.control} name="payment_amount" render={({
                field
              }) => <FormItem>
                      <FormLabel>Payment Amount</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5">₱</span>
                          <Input type="number" min="0" step="0.01" className="pl-7" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
                
                <FormField control={form.control} name="payment_status" render={({
                field
              }) => <FormItem>
                      <FormLabel>Payment Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="waived">Waived</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>} />
                
                <FormField control={form.control} name="status" render={({
                field
              }) => <FormItem>
                      <FormLabel>Document Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select document status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="issued">Issued</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>} />
              </div>
              
              {selectedDocType?.validity_days && <p className="text-sm text-muted-foreground">
                  This document will be valid for {selectedDocType.validity_days} days from the date of issuance.
                </p>}
              
              <div className="flex justify-end gap-3">
                {onClose && (
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
                  {isSubmitting ? <>Processing...</> : <>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Issue Document
                    </>}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default IssueDocumentForm;
