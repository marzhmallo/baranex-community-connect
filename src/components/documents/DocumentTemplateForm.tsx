
import { useState, useEffect } from "react";
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
import { ArrowLeft, Save, X } from "lucide-react";

const templateSchema = z.object({
  name: z.string().min(3, { message: "Template name must be at least 3 characters" }),
  description: z.string().optional(),
  template: z.string().min(10, { message: "Template content must be at least 10 characters" }),
  fee: z.coerce.number().min(0, { message: "Fee cannot be negative" }),
  validity_days: z.coerce.number().int().min(0, { message: "Validity days must be a positive integer or zero" }).optional(),
  required_fields: z.string().optional()
});

interface DocumentTemplateFormProps {
  template?: any;
  onClose: () => void;
  customEditor?: React.ReactNode;
  editorContent?: string;
}

const DocumentTemplateForm = ({ template, onClose, customEditor, editorContent }: DocumentTemplateFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: template?.name || "",
      description: template?.description || "",
      template: template?.template || "",
      fee: template?.fee || 0,
      validity_days: template?.validity_days || 30,
      required_fields: template?.required_fields ? JSON.stringify(template.required_fields, null, 2) : "{}"
    }
  });

  // Update form when editorContent changes
  useEffect(() => {
    if (editorContent !== undefined) {
      form.setValue("template", editorContent);
    }
  }, [editorContent, form]);
  
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    try {
      // Parse the JSON string to an object
      let parsedRequiredFields;
      try {
        parsedRequiredFields = JSON.parse(data.required_fields);
      } catch (e) {
        toast({
          title: "Invalid JSON format",
          description: "The required fields must be in valid JSON format.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      // Use editor content if available, otherwise use form data
      const templateContent = editorContent || data.template;
      
      // Prepare data for submission
      const templateData = {
        name: data.name,
        description: data.description,
        template: templateContent,
        fee: data.fee,
        validity_days: data.validity_days,
        required_fields: parsedRequiredFields
      };
      
      // Update or insert based on whether we're editing or creating
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
    <>
      {/* Header - Fixed */}
      <div className="flex items-center justify-between p-6 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold text-foreground">{template ? "Edit" : "Create"} Document Template</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-muted">
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Barangay Clearance" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="fee"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Fee (PHP)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="validity_days"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Validity (days)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter a brief description of this document template"
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
              name="template"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Content</FormLabel>
                  <p className="text-sm text-muted-foreground mb-2">
                    Use the rich text editor below to create your document template. Use the "Insert Data Field" button to add placeholders.
                  </p>
                  <FormControl>
                    {customEditor || (
                      <Textarea 
                        placeholder="Enter the document template content here..."
                        className="font-mono h-60 resize-none"
                        {...field}
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="required_fields"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Required Fields (JSON)</FormLabel>
                  <p className="text-sm text-muted-foreground mb-2">
                    Define required fields as a JSON object. These will generate a form when issuing documents.
                  </p>
                  <FormControl>
                    <Textarea 
                      placeholder='{"resident_name": "string", "purpose": "string"}'
                      className="font-mono h-40 resize-none"
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
              <>Saving...</>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {template ? "Update" : "Create"} Template
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
};

export default DocumentTemplateForm;
