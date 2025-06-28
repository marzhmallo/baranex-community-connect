
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Save, X } from "lucide-react";

const templateSchema = z.object({
  name: z.string().min(3, { message: "Template name must be at least 3 characters" }),
  description: z.string().optional(),
  fee: z.coerce.number().min(0, { message: "Fee cannot be negative" }),
  validity_days: z.coerce.number().int().min(0, { message: "Validity days must be a positive integer or zero" }).optional(),
});

interface DocumentTemplateFormProps {
  template?: any;
  onClose: () => void;
  onSuccess?: () => void;
}

const DocumentTemplateForm = ({ template, onClose, onSuccess }: DocumentTemplateFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: template?.name || "",
      description: template?.description || "",
      fee: template?.fee || 0,
      validity_days: template?.validity_days || 30,
    }
  });
  
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    try {
      const templateData = {
        name: data.name,
        description: data.description,
        template: "",
        fee: data.fee,
        validity_days: data.validity_days,
        required_fields: {}
      };
      
      const { data: result, error } = template 
        ? await supabase
            .from('document_types')
            .update(templateData)
            .eq('id', template.id)
            .select()
        : await supabase
            .from('document_types')
            .insert(templateData)
            .select();
            
      if (error) throw error;
      
      toast({
        title: template ? "Template Updated" : "Template Created",
        description: `Document template has been ${template ? "updated" : "created"} successfully.`,
      });
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Error submitting template:", error);
      toast({
        title: "Error",
        description: "Failed to save the document template.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {template ? "Edit Document Template" : "Add Document Template"}
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-1">
                Create a new document type that residents can request
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/50">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </DialogHeader>
      
      <div className="flex-1 p-6 overflow-y-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900">
                      Document Name *
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Barangay Clearance, Certificate of Residency" 
                        className="h-11"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900">
                      Description
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of this document type and its purpose..."
                        className="resize-none h-20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900">
                      Processing Fee (₱)
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        placeholder="0.00"
                        className="h-11"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="validity_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900">
                      Validity Period (days)
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        placeholder="30"
                        className="h-11"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="p-1 bg-blue-100 rounded-full mt-0.5">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-900 mb-1">
                    Document Processing Note
                  </h4>
                  <p className="text-sm text-blue-700">
                    Once created, residents can request this document type. Actual certificates will be created manually outside the system by admins.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
      
      <div className="border-t bg-gray-50 px-6 py-4">
        <div className="flex justify-end gap-3">
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
            className="min-w-[120px] bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {template ? "Update" : "Create"} Template
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DocumentTemplateForm;
