
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import DocumentsStats from "./DocumentsStats";
import DocumentsList from "./DocumentsList";
import { Button } from "@/components/ui/button";
import { FilePlus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import DocumentIssueForm from "./DocumentIssueForm";
import { Card, CardContent } from "@/components/ui/card";

const DocumentsPage = () => {
  const [issuingDocument, setIssuingDocument] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-6">
      <DocumentsStats />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search documents..."
            className="w-full pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Button
          onClick={() => setIssuingDocument(true)}
          className="w-full md:w-auto"
        >
          <FilePlus className="mr-2 h-4 w-4" />
          Issue New Document
        </Button>
      </div>
      
      <Tabs defaultValue="all" className="w-full" onValueChange={setFilterStatus}>
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          <DocumentsList status="all" searchQuery={searchQuery} />
        </TabsContent>
        
        <TabsContent value="pending" className="mt-0">
          <DocumentsList status="pending" searchQuery={searchQuery} />
        </TabsContent>
        
        <TabsContent value="approved" className="mt-0">
          <DocumentsList status="approved" searchQuery={searchQuery} />
        </TabsContent>
        
        <TabsContent value="rejected" className="mt-0">
          <DocumentsList status="rejected" searchQuery={searchQuery} />
        </TabsContent>
      </Tabs>
      
      {issuingDocument && (
        <Card className="mt-6 border-2 border-primary/20 animate-fade-in">
          <CardContent className="pt-6">
            <DocumentIssueForm onClose={() => setIssuingDocument(false)} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentsPage;
