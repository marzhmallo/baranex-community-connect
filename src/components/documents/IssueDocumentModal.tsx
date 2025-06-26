
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Eye } from "lucide-react";

interface DocumentTemplate {
  id: string;
  name: string;
  content: string;
}

interface Resident {
  id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  address?: string;
  birthdate: string;
}

interface IssueDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resident: Resident;
}

const IssueDocumentModal = ({ open, onOpenChange, resident }: IssueDocumentModalProps) => {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('document_types')
        .select('id, name, content')
        .eq('brgyid', userProfile?.brgyid);

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to load document templates",
        variant: "destructive",
      });
    }
  };

  const calculateAge = (birthdate: string) => {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const getResidentFullName = () => {
    const parts = [resident.first_name];
    if (resident.middle_name) parts.push(resident.middle_name);
    parts.push(resident.last_name);
    return parts.join(' ');
  };

  const processTemplate = (templateContent: string) => {
    const residentName = getResidentFullName();
    const residentAddress = resident.address || 'N/A';
    const residentAge = calculateAge(resident.birthdate).toString();
    const dateIssued = new Date().toLocaleDateString();

    return templateContent
      .replace(/\{\{resident_name\}\}/g, residentName)
      .replace(/\{\{resident_address\}\}/g, residentAddress)
      .replace(/\{\{resident_age\}\}/g, residentAge)
      .replace(/\{\{date_issued\}\}/g, dateIssued)
      .replace(/\{\{reason\}\}/g, reason);
  };

  const generateDocumentNumber = () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `DOC-${dateStr}-${randomNum}`;
  };

  const handleGeneratePreview = async () => {
    if (!selectedTemplate) {
      toast({
        title: "Error",
        description: "Please select a document template",
        variant: "destructive",
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reason for the request",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const template = templates.find(t => t.id === selectedTemplate);
      if (!template) throw new Error('Template not found');

      const processedContent = processTemplate(template.content);
      const documentNumber = generateDocumentNumber();

      // Create record in issued_documents table
      const { error } = await supabase
        .from('issued_documents')
        .insert({
          resident_id: resident.id,
          admin_id: userProfile?.id,
          document_id: selectedTemplate,
          document_number: documentNumber,
          data: { reason },
        });

      if (error) throw error;

      // Navigate to preview page with processed content
      navigate('/documents/preview', {
        state: {
          content: processedContent,
          templateName: template.name,
          residentName: getResidentFullName(),
        },
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error generating document:', error);
      toast({
        title: "Error",
        description: "Failed to generate document",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Issue Document
          </DialogTitle>
          <DialogDescription>
            Generate a document for {getResidentFullName()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="template">Document Template</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Select a document template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="reason">Reason for Request</Label>
            <Input
              id="reason"
              placeholder="e.g., For employment purposes"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleGeneratePreview} disabled={isLoading}>
              <Eye className="h-4 w-4 mr-2" />
              {isLoading ? 'Generating...' : 'Generate & Preview'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IssueDocumentModal;
