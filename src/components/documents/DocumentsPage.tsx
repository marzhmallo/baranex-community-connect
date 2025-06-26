import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DocumentTemplatesList from "./DocumentTemplatesList";
import DocumentTemplateForm from "./DocumentTemplateForm";
import DocumentsList from "./DocumentsList";
import IssueDocumentForm from "./IssueDocumentForm";
import DocumentLogsList from "./DocumentLogsList";
import DocumentsStats from "./DocumentsStats";

const DocumentsPage = () => {
  const navigate = useNavigate();
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showIssueDocument, setShowIssueDocument] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const handleCreateTemplate = () => {
    navigate("/documents/add");
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setShowCreateTemplate(true);
  };

  const handleIssueDocument = (template) => {
    setSelectedTemplate(template);
    setShowIssueDocument(true);
  };

  const handleCloseCreateTemplate = () => {
    setShowCreateTemplate(false);
    setEditingTemplate(null);
  };

  const handleCloseIssueDocument = () => {
    setShowIssueDocument(false);
    setSelectedTemplate(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents Management</h1>
          <p className="text-muted-foreground">Manage document templates and issue official documents</p>
        </div>
        <Button onClick={handleCreateTemplate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </div>

      <DocumentsStats />

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="logs">Document Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Templates</CardTitle>
              <CardDescription>
                Manage templates for different types of barangay documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentTemplatesList onEditTemplate={handleEditTemplate} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Issued Documents</CardTitle>
                <CardDescription>
                  View and manage all issued barangay documents
                </CardDescription>
              </div>
              <Button onClick={() => setShowIssueDocument(true)} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Issue Document
              </Button>
            </CardHeader>
            <CardContent>
              <DocumentsList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Activity Logs</CardTitle>
              <CardDescription>
                Track all document-related activities and changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentLogsList />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Creation/Edit Modal */}
      {showCreateTemplate && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-in fade-in-0 duration-300">
          <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300">
            <DocumentTemplateForm 
              template={editingTemplate} 
              onClose={handleCloseCreateTemplate}
            />
          </div>
        </div>
      )}

      {/* Issue Document Modal */}
      {showIssueDocument && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-in fade-in-0 duration-300">
          <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300">
            <IssueDocumentForm 
              template={selectedTemplate}
              onClose={handleCloseIssueDocument}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
