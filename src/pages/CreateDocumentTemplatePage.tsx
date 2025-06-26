
import { useState, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, Save, X, Plus } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const templateSchema = z.object({
  name: z.string().min(3, { message: "Template name must be at least 3 characters" }),
  description: z.string().optional(),
  template: z.string().min(10, { message: "Template content must be at least 10 characters" }),
  fee: z.coerce.number().min(0, { message: "Fee cannot be negative" }),
  validity_days: z.coerce.number().int().min(0, { message: "Validity days must be a positive integer or zero" }).optional(),
  required_fields: z.string().optional()
});

const CreateDocumentTemplatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const template = location.state?.template || null;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templateContent, setTemplateContent] = useState(template?.template || "");
  const { toast } = useToast();
  const quillRef = useRef<ReactQuill>(null);

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

  const dataFieldOptions = [
    { label: "Resident's Full Name", value: "resident_name" },
    { label: "Resident's Address", value: "resident_address" },
    { label: "Resident's Age", value: "resident_age" },
    { label: "Date Issued", value: "date_issued" },
    { label: "Reason for Request", value: "reason_for_request" }
  ];

  const insertDataField = (label: string, value: string) => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      const range = quill.getSelection();
      if (range) {
        const pillHtml = `<span class="data-field-pill" data-placeholder="${value}" contenteditable="false" style="background-color: #e3f2fd; color: #1976d2; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500; margin: 0 2px; display: inline-block;">${label}</span>`;
        quill.clipboard.dangerouslyPasteHTML(range.index, pillHtml);
        quill.setSelection({ index: range.index + 1, length: 0 });
      }
    }
  };

  const CustomToolbar = () => (
    <div id="toolbar" className="border-b border-gray-200 pb-2 mb-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* Standard Quill formatting buttons */}
        <select className="ql-header" defaultValue="">
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="">Normal</option>
        </select>
        <button className="ql-bold" />
        <button className="ql-italic" />
        <button className="ql-underline" />
        <button className="ql-list" value="ordered" />
        <button className="ql-list" value="bullet" />
        <button className="ql-align" value="" />
        <button className="ql-align" value="center" />
        <button className="ql-align" value="right" />
        
        {/* Custom Data Field Button */}
        <div className="ml-2 border-l border-gray-300 pl-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Plus className="h-4 w-4 mr-1" />
                Insert Data Field
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {dataFieldOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => insertDataField(option.label, option.value)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );

  const modules = useMemo(() => ({
    toolbar: {
      container: "#toolbar"
    }
  }), []);

  const formats = [
    'header', 'bold', 'italic', 'underline', 'list', 'bullet', 'align'
  ];

  const handleClose = () => {
    navigate("/documents");
  };

  const onSubmit = async (data: any) => {
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
      
      handleClose();
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - Fixed */}
      <div className="flex items-center justify-between p-6 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleClose} className="hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold text-foreground">{template ? "Edit" : "Create"} Document Template</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={handleClose} className="hover:bg-muted">
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
            
            {/* Rich Text Editor for Template Content */}
            <div className="space-y-2">
              <FormLabel>Template Content</FormLabel>
              <p className="text-sm text-muted-foreground">
                Use the rich text editor below to create your document template. Click "Insert Data Field" to add dynamic placeholders.
              </p>
              <div className="border rounded-md">
                <CustomToolbar />
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={templateContent}
                  onChange={setTemplateContent}
                  modules={modules}
                  formats={formats}
                  className="min-h-[300px]"
                />
              </div>
              {templateContent.length < 10 && (
                <p className="text-sm text-red-500">Template content must be at least 10 characters</p>
              )}
            </div>
            
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
            onClick={handleClose}
            className="min-w-[100px]"
          >
            Cancel
          </Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting || templateContent.length < 10}
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
    </div>
  );
};

export default CreateDocumentTemplatePage;
