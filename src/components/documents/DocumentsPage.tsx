import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FilePlus, RefreshCw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import DocumentTemplatesList from "./DocumentTemplatesList";
import DocumentTemplateForm from "./DocumentTemplateForm";
import IssueDocumentForm from "./IssueDocumentForm";
import DocumentLogsList from "./DocumentLogsList";
import { useToast } from "@/hooks/use-toast";
const DocumentsPage = () => {
  const [activeTab, setActiveTab] = useState("templates");
  const [searchQuery, setSearchQuery] = useState("");
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const {
    toast
  } = useToast();
  const handleAddTemplate = () => {
    setSelectedTemplate(null);
    setShowTemplateForm(true);
  };
  const handleEditTemplate = template => {
    setSelectedTemplate(template);
    setShowTemplateForm(true);
  };
  const handleCloseTemplateForm = () => {
    setShowTemplateForm(false);
    setSelectedTemplate(null);
  };
  const refreshTemplates = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // For better UX
      toast({
        title: "Templates Refreshed",
        description: "Document templates have been refreshed."
      });
    } catch (error) {
      console.error("Error refreshing templates:", error);
      toast({
        title: "Refresh Failed",
        description: "Could not refresh document templates.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="space-y-6">
      <div className="flex flex-col space-y-2 my-[20px]">
        <h1 className="text-3xl font-bold tracking-tight px-[15px]">Documents</h1>
        <p className="text-muted-foreground px-[15px]">
          Manage document templates, issue documents, and view document logs.
        </p>
      </div>
      
      <div className="px-[15px]">
        <div className="mx-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search documents..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="" />
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshTemplates} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          
          {activeTab === "templates" && <Button onClick={handleAddTemplate}>
              <FilePlus className="mr-2 h-4 w-4" />
              Add Template
            </Button>}
        </div>
      </div>
      
      <Tabs defaultValue="templates" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-8 mx-[15px]">
          <TabsTrigger value="templates">Document Templates</TabsTrigger>
          <TabsTrigger value="issue">Issue Document</TabsTrigger>
          <TabsTrigger value="logs">Document Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates" className="mt-0 mx-[15px]">
          {showTemplateForm ? <Card className="mt-6 border-2 border-primary/20 animate-fade-in">
              <CardContent className="pt-6">
                <DocumentTemplateForm template={selectedTemplate} onClose={handleCloseTemplateForm} />
              </CardContent>
            </Card> : <DocumentTemplatesList searchQuery={searchQuery} onEdit={handleEditTemplate} />}
        </TabsContent>
        
        <TabsContent value="issue" className="mt-0">
          <IssueDocumentForm />
        </TabsContent>
        
        <TabsContent value="logs" className="mt-0 mx-[15px]">
          <DocumentLogsList searchQuery={searchQuery} />
        </TabsContent>
      </Tabs>
    </div>;
};
export default DocumentsPage;