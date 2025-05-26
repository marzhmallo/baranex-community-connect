
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Badge } from '@/components/ui/badge';

const DocumentRequestsStatus = () => {
  const { user, userProfile } = useAuth();

  const { data: documents, isLoading } = useQuery({
    queryKey: ['user-documents', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // First, get the resident record for the current user
      const { data: resident, error: residentError } = await supabase
        .from('residents')
        .select('id')
        .eq('email', user.email)
        .single();

      if (residentError || !resident) return [];

      const { data, error } = await supabase
        .from('issued_documents')
        .select(`
          *,
          document_type:document_types(name)
        `)
        .eq('resident_id', resident.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'issued':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'issued':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Your Documents
        </CardTitle>
        <CardDescription>Track your certificate and document requests</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : documents && documents.length > 0 ? (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(doc.status)}
                  <div>
                    <p className="font-medium text-sm">
                      {doc.document_type?.name || 'Document'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Requested: {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge variant={getStatusVariant(doc.status) as any} className="text-xs">
                  {doc.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No document requests found.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentRequestsStatus;
