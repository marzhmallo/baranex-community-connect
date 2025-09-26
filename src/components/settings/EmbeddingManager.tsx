import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import { Database, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface TableStatus {
  name: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  processed?: number;
  errors?: number;
  message?: string;
}

const TABLES_TO_EMBED = [
  { name: 'residents', displayName: 'Residents' },
  { name: 'announcements', displayName: 'Announcements' }, 
  { name: 'docrequests', displayName: 'Document Requests' },
  { name: 'events', displayName: 'Events' },
  { name: 'households', displayName: 'Households' }
];

export const EmbeddingManager = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [tableStatuses, setTableStatuses] = useState<TableStatus[]>(
    TABLES_TO_EMBED.map(table => ({ name: table.name, status: 'idle' }))
  );

  const updateTableStatus = (tableName: string, updates: Partial<TableStatus>) => {
    setTableStatuses(prev => prev.map(table => 
      table.name === tableName ? { ...table, ...updates } : table
    ));
  };

  const processTable = async (tableName: string, brgyid: string) => {
    updateTableStatus(tableName, { status: 'processing', message: 'Generating embeddings...' });

    try {
      const { data, error } = await supabase.functions.invoke('generate-embeddings', {
        body: { tableName, brgyid }
      });

      if (error) throw error;

      updateTableStatus(tableName, { 
        status: 'completed',
        processed: data.processed,
        errors: data.errors,
        message: `Processed ${data.processed} records${data.errors ? `, ${data.errors} errors` : ''}`
      });

      return data;
    } catch (error: any) {
      console.error(`Error processing ${tableName}:`, error);
      updateTableStatus(tableName, { 
        status: 'error', 
        message: error.message || 'Unknown error occurred'
      });
      throw error;
    }
  };

  const generateAllEmbeddings = async () => {
    if (!userProfile?.brgyid) {
      toast({
        title: "Error",
        description: "No barangay ID found",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      let totalProcessed = 0;
      let totalErrors = 0;

      // Process each table sequentially to avoid overwhelming the API
      for (const table of TABLES_TO_EMBED) {
        const result = await processTable(table.name, userProfile.brgyid);
        totalProcessed += result.processed || 0;
        totalErrors += result.errors || 0;
        
        // Small delay between tables
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      toast({
        title: "Embedding Generation Complete",
        description: `Successfully processed ${totalProcessed} records across all tables. ${totalErrors > 0 ? `${totalErrors} errors occurred.` : ''}`,
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete embedding generation",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetStatuses = () => {
    setTableStatuses(TABLES_TO_EMBED.map(table => ({ name: table.name, status: 'idle' })));
  };

  const getStatusIcon = (status: TableStatus['status']) => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Database className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: TableStatus['status']) => {
    switch (status) {
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const completedTables = tableStatuses.filter(t => t.status === 'completed').length;
  const progressPercentage = (completedTables / TABLES_TO_EMBED.length) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          AI Chatbot Setup - Embedding Generation
        </CardTitle>
        <CardDescription>
          Generate vector embeddings for your data to enable AI-powered search in your chatbot. 
          This process analyzes your existing data and creates searchable indexes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Overview */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing Tables</span>
              <span>{completedTables}/{TABLES_TO_EMBED.length}</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        {/* Table Status List */}
        <div className="space-y-3">
          {TABLES_TO_EMBED.map((table) => {
            const status = tableStatuses.find(s => s.name === table.name);
            return (
              <div key={table.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(status?.status || 'idle')}
                  <div>
                    <p className="font-medium">{table.displayName}</p>
                    <p className="text-sm text-muted-foreground">
                      {status?.message || 'Ready to process'}
                    </p>
                  </div>
                </div>
                <Badge className={getStatusColor(status?.status || 'idle')}>
                  {status?.status || 'idle'}
                </Badge>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={generateAllEmbeddings}
            disabled={isProcessing || userProfile?.role !== 'admin'}
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Generate All Embeddings
              </>
            )}
          </Button>
          
          {!isProcessing && tableStatuses.some(t => t.status !== 'idle') && (
            <Button
              onClick={resetStatuses}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
          <p><strong>Note:</strong> This process may take a few minutes depending on your data size. 
          Once completed, your chatbot will be able to search and answer questions about your residents, 
          announcements, documents, events, and households. Future records will be automatically indexed.</p>
        </div>
      </CardContent>
    </Card>
  );
};