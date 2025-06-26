import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, FileText, Clock, Users, Star, Calendar, Filter, MoreHorizontal, Edit, Trash2, Copy, Download, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DocumentTemplatesList from "./DocumentTemplatesList";
import DocumentsList from "./DocumentsList";
import DocumentLogsList from "./DocumentLogsList";
import DocumentsStats from "./DocumentsStats";
import IssueDocumentForm from "./IssueDocumentForm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";

interface DocumentType {
  id: string;
  created_at: string;
  name: string;
  description: string;
  template: string;
  fee: number;
  validity_days: number;
  required_fields: string[];
  status: 'active' | 'inactive';
}

interface DocumentLog {
  id: string;
  created_at: string;
  activity_type: string;
  document_id: string;
  user_id: string;
  details: any;
}

const DocumentsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [documentTypeFilter, setDocumentTypeFilter] = useState("all");
  const [activityFilter, setActivityFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentType | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const { data: templates, refetch: refetchTemplates } = useQuery(
    ["documentTemplates", searchQuery, statusFilter],
    async () => {
      let query = supabase
        .from("document_types")
        .select("*")
        .ilike("name", `%${searchQuery}%`);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter === "active");
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DocumentType[];
    }
  );

  const { data: logs, refetch: refetchLogs } = useQuery(
    ["documentLogs", searchQuery, activityFilter, dateFilter],
    async () => {
      let query = supabase
        .from("document_logs")
        .select("*")
        .ilike("details", `%${searchQuery}%`);

      if (activityFilter !== "all") {
        query = query.eq("activity_type", activityFilter);
      }

      // Implement date filtering logic here based on dateFilter value

      const { data, error } = await query;
      if (error) throw error;
      return data as DocumentLog[];
    }
  );

  const handleIssueDocument = (template: DocumentType) => {
    setSelectedTemplate(template);
    setShowIssueForm(true);
  };

  const handleEditTemplate = (template: DocumentType) => {
    setSelectedTemplate(template);
    setShowEditForm(true);
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplateToDelete(templateId);
    setShowDeleteDialog(true);
  };

  const handleDuplicateTemplate = async (template: DocumentType) => {
    try {
      const templateData = {
        name: `${template.name} (Copy)`,
        description: template.description,
        template: template.template,
        fee: template.fee,
        validity_days: template.validity_days,
        required_fields: template.required_fields,
        status: template.status
      };

      const { data, error } = await supabase
        .from('document_types')
        .insert(templateData)
        .select();

      if (error) throw error;

      toast({
        title: "Template Duplicated",
        description: `Document template "${template.name}" has been duplicated successfully.`,
      });

      refetchTemplates();
    } catch (error) {
      console.error("Error duplicating template:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate the document template.",
        variant: "destructive",
      });
    }
  };

  const handleToggleTemplateStatus = async (template: DocumentType) => {
    try {
      const newStatus = template.status === 'active' ? 'inactive' : 'active';

      const { data, error } = await supabase
        .from('document_types')
        .update({ status: newStatus })
        .eq('id', template.id)
        .select();

      if (error) throw error;

      toast({
        title: "Template Status Updated",
        description: `Document template "${template.name}" has been ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully.`,
      });

      refetchTemplates();
    } catch (error) {
      console.error("Error toggling template status:", error);
      toast({
        title: "Error",
        description: "Failed to update the document template status.",
        variant: "destructive",
      });
    }
  };

  const handleViewDocument = (documentId: string) => {
    // Implement view document logic here
    console.log("View document:", documentId);
  };

  const handlePrintDocument = (documentId: string) => {
    // Implement print document logic here
    console.log("Print document:", documentId);
  };

  const handleDownloadDocument = (documentId: string) => {
    // Implement download document logic here
    console.log("Download document:", documentId);
  };

  const handleIssueFormClose = () => {
    setShowIssueForm(false);
    setSelectedTemplate(null);
  };

  const handleEditFormClose = () => {
    setShowEditForm(false);
    setSelectedTemplate(null);
  };

  const confirmDeleteTemplate = async () => {
    if (!templateToDelete) return;

    try {
      const { error } = await supabase
        .from('document_types')
        .delete()
        .eq('id', templateToDelete);

      if (error) throw error;

      toast({
        title: "Template Deleted",
        description: "Document template has been deleted successfully.",
      });

      refetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({
        title: "Error",
        description: "Failed to delete the document template.",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setTemplateToDelete(null);
    }
  };

  const handleCreateNewTemplate = () => {
    navigate("/documents/new");
  };

  return <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents Management</h1>
          <p className="text-muted-foreground">
            Manage document templates, issue certificates, and track document history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleCreateNewTemplate} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Template
          </Button>
        </div>
      </div>

      <DocumentsStats />

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="issued" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Issued Documents
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Activity Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DocumentTemplatesList 
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            onEditTemplate={handleEditTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onDuplicateTemplate={handleDuplicateTemplate}
            onToggleStatus={handleToggleTemplateStatus}
            onIssueDocument={handleIssueDocument}
          />
        </TabsContent>

        <TabsContent value="issued" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search issued documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={documentTypeFilter} onValueChange={setDocumentTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="barangay_clearance">Barangay Clearance</SelectItem>
                <SelectItem value="certificate">Certificate</SelectItem>
                <SelectItem value="id">ID</SelectItem>
                <SelectItem value="permit">Permit</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DocumentsList 
            searchQuery={searchQuery}
            typeFilter={documentTypeFilter}
            dateFilter={dateFilter}
            onViewDocument={handleViewDocument}
            onPrintDocument={handlePrintDocument}
            onDownloadDocument={handleDownloadDocument}
          />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search activity logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={activityFilter} onValueChange={setActivityFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by activity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="created">Document Created</SelectItem>
                <SelectItem value="issued">Document Issued</SelectItem>
                <SelectItem value="printed">Document Printed</SelectItem>
                <SelectItem value="downloaded">Document Downloaded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DocumentLogsList 
            searchQuery={searchQuery}
            activityFilter={activityFilter}
            dateFilter={dateFilter}
          />
        </TabsContent>
      </Tabs>

      {showIssueForm && selectedTemplate && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl border border-border max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <IssueDocumentForm template={selectedTemplate} onClose={handleIssueFormClose} />
          </div>
        </div>
      )}

      {showEditForm && selectedTemplate && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl border border-border max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <DocumentTemplateForm template={selectedTemplate} onClose={handleEditFormClose} />
          </div>
        </div>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTemplate} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};

export default DocumentsPage;
