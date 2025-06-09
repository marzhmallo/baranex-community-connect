
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, Calendar, Download } from "lucide-react";
import moment from "moment";

const UserDocumentsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("available");
  const { userProfile } = useAuth();

  // For now, show a simple message about document services
  const mockTemplates = [
    {
      id: '1',
      name: 'Barangay Clearance',
      description: 'Certificate of good moral character and residence',
      fee: 50,
      requirements: 'Valid ID, Proof of residence'
    },
    {
      id: '2', 
      name: 'Certificate of Indigency',
      description: 'Certification for financial assistance applications',
      fee: 0,
      requirements: 'Valid ID, Proof of income (if any)'
    },
    {
      id: '3',
      name: 'Business Permit',
      description: 'Permit to operate small business in the barangay',
      fee: 200,
      requirements: 'Valid ID, Business registration, Location map'
    }
  ];

  // Fetch user's document requests (simplified for now)
  const { data: userDocuments, isLoading: documentsLoading } = useQuery({
    queryKey: ['user-documents'],
    queryFn: async () => {
      // For now return empty array - this would connect to actual issued documents
      return [];
    },
    enabled: !!userProfile?.id
  });

  const filteredTemplates = mockTemplates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                    {template.name}
                  </CardTitle>
                  {template.description && (
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Available</Badge>
                      {template.fee > 0 && (
                        <Badge variant="outline">₱{template.fee}</Badge>
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
                    <p className="text-muted-foreground">No document templates found matching your search.</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="mt-0">
          <div className="space-y-4">
            {userDocuments?.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">You haven't requested any documents yet.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Visit the barangay office to request documents.
                  </p>
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
