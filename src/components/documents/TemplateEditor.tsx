
import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, Save, Plus } from "lucide-react";

// Custom Quill module for inserting data fields
const Block = Quill.import('blots/block');

class DataFieldBlot extends Block {
  static create(value: any) {
    const node = super.create();
    node.setAttribute('data-placeholder', value.key);
    node.setAttribute('contenteditable', 'false');
    node.style.display = 'inline-block';
    node.style.backgroundColor = '#e3f2fd';
    node.style.color = '#1976d2';
    node.style.padding = '2px 8px';
    node.style.margin = '0 2px';
    node.style.borderRadius = '12px';
    node.style.fontSize = '14px';
    node.style.fontWeight = '500';
    node.textContent = value.label;
    return node;
  }

  static value(node: any) {
    return {
      key: node.getAttribute('data-placeholder'),
      label: node.textContent
    };
  }
}

DataFieldBlot.blotName = 'dataField';
DataFieldBlot.tagName = 'span';
Quill.register(DataFieldBlot);

const TemplateEditor = () => {
  const [templateName, setTemplateName] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const quillRef = useRef<ReactQuill>(null);
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { toast } = useToast();

  const dataFields = [
    { key: "resident_name", label: "Resident's Full Name" },
    { key: "resident_address", label: "Resident's Address" },
    { key: "resident_age", label: "Resident's Age" },
    { key: "date_issued", label: "Date Issued" },
    { key: "reason", label: "Reason for Request" },
  ];

  const insertDataField = useCallback((field: { key: string; label: string }) => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const range = quill.getSelection();
      if (range) {
        quill.insertEmbed(range.index, 'dataField', field);
        quill.setSelection(range.index + 1);
      }
    }
  }, []);

  const convertContentForSaving = (htmlContent: string) => {
    // Parse HTML and convert data field spans back to placeholder format
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const dataFieldSpans = doc.querySelectorAll('span[data-placeholder]');
    
    dataFieldSpans.forEach(span => {
      const key = span.getAttribute('data-placeholder');
      const placeholder = document.createTextNode(`{{${key}}}`);
      span.parentNode?.replaceChild(placeholder, span);
    });
    
    return doc.body.innerHTML;
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a template name",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please add some content to the template",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const convertedContent = convertContentForSaving(content);
      
      const { error } = await supabase
        .from('document_types')
        .insert({
          name: templateName,
          content: convertedContent,
          brgyid: userProfile?.brgyid,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Template saved successfully",
      });

      navigate('/documents');
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['clean']
    ],
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/documents')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Create Document Template</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              placeholder="e.g., Barangay Clearance"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Template Content</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Insert Data Field
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {dataFields.map((field) => (
                    <DropdownMenuItem
                      key={field.key}
                      onClick={() => insertDataField(field)}
                    >
                      {field.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="border rounded-md">
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={content}
                onChange={setContent}
                modules={modules}
                style={{ minHeight: '300px' }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => navigate('/documents')}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Template'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplateEditor;
