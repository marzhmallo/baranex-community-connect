import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";

// Custom Quill module for inserting data fields
const DataFieldModule = () => {
  const quill = useRef<any>(null);
  
  useEffect(() => {
    if (quill.current) {
      const toolbar = quill.current.getModule('toolbar');
      toolbar.addHandler('dataField', showDataFieldDropdown);
    }
  }, []);

  const showDataFieldDropdown = () => {
    const dropdown = document.getElementById('data-field-dropdown');
    if (dropdown) {
      dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
  };

  return null;
};

// Register the custom module
Quill.register('modules/dataField', DataFieldModule);

const DocumentTemplateEditorPage = () => {
  const [templateName, setTemplateName] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const quillRef = useRef<ReactQuill>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const dataFields = [
    { label: "Resident's Full Name", key: "resident_name" },
    { label: "Resident's Address", key: "resident_address" },
    { label: "Resident's Age", key: "resident_age" },
    { label: "Date Issued", key: "date_issued" },
    { label: "Reason for Request", key: "reason_for_request" }
  ];

  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'align': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link'],
        ['clean'],
        ['dataField'] // Custom button
      ],
      handlers: {
        dataField: () => setShowDropdown(!showDropdown)
      }
    }
  };

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'align', 'list', 'bullet', 'link'
  ];

  const insertDataField = (field: { label: string; key: string }) => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const range = quill.getSelection();
      
      if (range) {
        // Create a styled span element for the data field
        const spanHtml = `<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-md font-medium border border-blue-200" data-placeholder="${field.key}" contenteditable="false">${field.label}</span>&nbsp;`;
        
        quill.clipboard.dangerouslyPasteHTML(range.index, spanHtml);
        quill.setSelection(range.index + field.label.length + 1);
      }
    }
    setShowDropdown(false);
  };

  const convertHtmlToTemplate = (html: string): string => {
    // Parse HTML and replace data field spans with placeholder format
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const dataFieldSpans = tempDiv.querySelectorAll('span[data-placeholder]');
    dataFieldSpans.forEach(span => {
      const placeholder = span.getAttribute('data-placeholder');
      if (placeholder) {
        const placeholderText = `{{${placeholder}}}`;
        span.replaceWith(document.createTextNode(placeholderText));
      }
    });
    
    return tempDiv.innerHTML;
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a template name.",
        variant: "destructive",
      });
      return;
    }

    if (!editorContent.trim()) {
      toast({
        title: "Error",
        description: "Please add some content to the template.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Convert HTML content with data field spans to template format
      const templateContent = convertHtmlToTemplate(editorContent);
      
      const { error } = await supabase
        .from('document_types')
        .insert({
          name: templateName,
          template: templateContent,
          description: `Template for ${templateName}`,
          fee: 0,
          validity_days: 30,
          required_fields: {}
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Template saved successfully!",
      });

      navigate('/documents');
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/documents')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">New Document Template</h1>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="templateName">Template Name</Label>
          <Input
            id="templateName"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Enter template name (e.g., Barangay Clearance)"
            className="max-w-md"
          />
        </div>

        <div className="space-y-2">
          <Label>Template Content</Label>
          <div className="relative">
            <div className="border rounded-lg">
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={editorContent}
                onChange={setEditorContent}
                modules={modules}
                formats={formats}
                style={{ minHeight: '300px' }}
              />
            </div>
            
            {/* Custom Data Field Dropdown */}
            {showDropdown && (
              <div className="absolute top-12 left-4 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48">
                <div className="py-2">
                  <div className="px-3 py-2 text-sm font-medium text-gray-700 border-b">
                    Insert Data Field
                  </div>
                  {dataFields.map((field) => (
                    <button
                      key={field.key}
                      onClick={() => insertDataField(field)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                    >
                      {field.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Use the "Insert Data Field" button in the toolbar to add dynamic fields that will be replaced with actual data when documents are generated.
          </p>
        </div>

        <div className="flex gap-4">
          <Button
            onClick={handleSaveTemplate}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isLoading ? 'Saving...' : 'Save Template'}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => navigate('/documents')}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DocumentTemplateEditorPage;
