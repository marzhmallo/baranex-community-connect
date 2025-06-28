
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArrowLeft, Save, X } from "lucide-react";

const requestSchema = z.object({
  resident_name: z.string().min(2, { message: "Resident name must be at least 2 characters" }),
  document_type: z.string().min(1, { message: "Please select a document type" }),
  purpose: z.string().min(5, { message: "Purpose must be at least 5 characters" }),
  contact_info: z.string().optional(),
  notes: z.string().optional(),
  fee: z.coerce.number().min(0, { message: "Fee cannot be negative" }),
  status: z.string().default("pending")
});

interface DocumentRequestFormProps {
  onClose: () => void;
}

const DocumentRequestForm = ({ onClose }: DocumentRequestFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      resident_name: "",
      document_type: "",
      purpose: "",
      contact_info: "",
      notes: "",
      fee: 0,
      status: "pending"
    }
  });
  
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    try {
      const requestData = {
        resident_name: data.resident_name,
        document_type: data.document_type,
        purpose: data.purpose,
        contact_info: data.contact_info,
        notes: data.notes,
        fee: data.fee,
        status: data.status,
        requested_date: new Date().toISOString(),
        tracking_id: `DOC-${Date.now()}`
      };
      
      // For now, we'll just show success since we're not storing in database yet
      // You can add database storage later if needed
      console.log("Document request:", requestData);
      
      toast({
        title: "Document Request Created",
        description: `Document request for ${data.resident_name} has been logged successfully.`,
      });
      
      onClose();
    } catch (error) {
      console.error("Error creating document request:", error);
      toast({
        title: "Error",
        description: "Failed to create the document request.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const documentTypes = [
    "Barangay Clearance",
    "Certificate of Residency", 
    "Certificate of Indigency",
    "Business Permit",
    "Barangay ID",
    "Other"
  ];

  return (
    <>
      {/* Header - Fixed */}
      <div className="flex items-center justify-between p-6 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold text-foreground">Log Document Request</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-muted">
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Document Request Management</h3>
          <p className="text-sm text-blue-700">
            This form is used to log and track document requests from residents. 
            The actual certificates will be created outside the system by the admin.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="resident_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resident Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter resident's full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="document_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {documentTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Processing Fee (PHP)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contact_info"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Information</FormLabel>
                    <FormControl>
                      <Input placeholder="Phone number or email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter the purpose for requesting this document"
                      className="resize-none h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional information or special requirements"
                      className="resize-none h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>
      
      {/* Footer with Action Buttons - Fixed */}
      <div className="border-t border-border bg-card p-6 flex-shrink-0">
        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            className="min-w-[100px]"
          >
            Cancel
          </Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>Logging...</>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Log Request
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
};

export default DocumentRequestForm;
