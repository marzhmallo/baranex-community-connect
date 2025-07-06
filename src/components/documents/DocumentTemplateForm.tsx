
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/components/AuthProvider";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

interface DocumentTemplateFormProps {
  template?: any;
  onClose: () => void;
  onSuccess?: () => void;
}

const DocumentTemplateForm = ({ template, onClose, onSuccess }: DocumentTemplateFormProps) => {
  const [content, setContent] = useState(template?.content || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { userProfile } = useAuth();
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      name: template?.name || "",
      description: template?.description || "",
      fee: template?.fee || 0,
      validity_days: template?.validity_days || null,
    }
  });

  useEffect(() => {
    if (template) {
      reset({
        name: template.name,
        description: template.description,
        fee: template.fee,
        validity_days: template.validity_days,
      });
      setContent(template.content || "");
    }
  }, [template, reset]);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const templateData = {
        name: data.name,
        description: data.description,
        template: content,
        content: content,
        fee: Number(data.fee),
        validity_days: data.validity_days ? Number(data.validity_days) : null,
        required_fields: {},
        brgyid: userProfile?.brgyid || "00000000-0000-0000-0000-000000000000"
      };

      let result;
      if (template?.id) {
        // Update existing template
        result = await supabase
          .from('document_types')
          .update(templateData)
          .eq('id', template.id);
      } else {
        // Create new template
        result = await supabase
          .from('document_types')
          .insert([templateData]);
      }

      if (result.error) throw result.error;

      toast({
        title: template?.id ? "Template Updated" : "Template Created",
        description: `Document template has been ${template?.id ? 'updated' : 'created'} successfully.`,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error saving template:", error);
      toast({
        title: "Error",
        description: "Failed to save the template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{template?.id ? 'Edit' : 'Create'} Document Template</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              {...register("name", { required: "Template name is required" })}
              placeholder="e.g., Barangay Clearance"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{String(errors.name.message)}</p>
            )}
          </div>

          <div>
            <Label htmlFor="fee">Fee (₱)</Label>
            <Input
              id="fee"
              type="number"
              step="0.01"
              min="0"
              {...register("fee")}
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="Brief description of this document"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="validity_days">Validity Period (Days)</Label>
          <Input
            id="validity_days"
            type="number"
            min="1"
            {...register("validity_days")}
            placeholder="e.g., 365 for 1 year"
          />
        </div>

        <div>
          <Label htmlFor="content">Template Content *</Label>
          <div className="mt-2">
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              placeholder="Enter the document template content here..."
              style={{ height: "200px", marginBottom: "50px" }}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting ? "Saving..." : template?.id ? "Update Template" : "Create Template"}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </>
  );
};

export default DocumentTemplateForm;
