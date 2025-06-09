
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, Calendar, Eye, Download } from "lucide-react";
import moment from "moment";

const UserDocumentsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("available");
  const { userProfile } = useAuth();

  // Fetch available document templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['user-document-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('brgyid', userProfile?.brgyid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userProfile?.brgyid
  });

  // Fetch user's document requests
  const { data: userDocuments, isLoading: documentsLoading } = useQuery({
    queryKey: ['user-documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('issued_documents')
        .select(`
          *,
          document_templates (
            template_name,
            description
          )
        `)
        .eq('resident_id', userProfile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userProfile?.id
  });

  const filteredTemplates = templates?.filter(template =>
    template.template_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDocuments = userDocuments?.filter(doc =>
    doc.document_templates?.template_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (templatesLoading || documentsLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Document Services</h1>
          <p className="text-muted-foreground">Request and track your barangay documents</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start justify-between mb-6">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search documents..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            className="pl-8" 
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="available">Available Documents</TabsTrigger>
          <TabsTrigger value="requests">My Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates?.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {template.template_name}
                  </CardTitle>
                  {template.description && (
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Available</Badge>
                      {template.fee_amount > 0 && (
                        <Badge variant="outline">₱{template.fee_amount}</Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <p><strong>Requirements:</strong></p>
                      <p className="whitespace-pre-wrap">{template.requirements || 'None specified'}</p>
                    </div>
                    
                    <Button className="w-full" disabled>
                      <FileText className="mr-2 h-4 w-4" />
                      Request Document
                    </Button>
                    
                    <p className="text-xs text-muted-foreground text-center">
                      Contact barangay office to request
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredTemplates?.length === 0 && (
              <div className="col-span-full">
                <Card>
                  <CardContent className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No document templates available.</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="mt-0">
          <div className="space-y-4">
            {filteredDocuments?.map((document) => (
              <Card key={document.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h3 className="font-medium">
                        {document.document_templates?.template_name || 'Unknown Document'}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Requested: {moment(document.created_at).format('MMM DD, YYYY')}
                        </div>
                        {document.issued_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Issued: {moment(document.issued_date).format('MMM DD, YYYY')}
                          </div>
                        )}
                      </div>
                      {document.purpose && (
                        <p className="text-sm text-muted-foreground">
                          <strong>Purpose:</strong> {document.purpose}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-right space-y-2">
                      <Badge 
                        variant={
                          document.status === 'issued' ? 'default' :
                          document.status === 'processing' ? 'secondary' :
                          'outline'
                        }
                      >
                        {document.status}
                      </Badge>
                      
                      {document.document_url && (
                        <div>
                          <Button variant="outline" size="sm" asChild>
                            <a href={document.document_url} target="_blank" rel="noopener noreferrer">
                              <Download className="mr-2 h-3 w-3" />
                              Download
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredDocuments?.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">You haven't requested any documents yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserDocumentsPage;
