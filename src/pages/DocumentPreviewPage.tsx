
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Printer, ArrowLeft } from "lucide-react";

const DocumentPreviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [documentData, setDocumentData] = useState<{
    content: string;
    templateName: string;
    residentName: string;
  } | null>(null);

  useEffect(() => {
    if (location.state) {
      setDocumentData(location.state as any);
    } else {
      // Redirect back if no data
      navigate('/documents');
    }
  }, [location, navigate]);

  const handlePrint = () => {
    window.print();
  };

  if (!documentData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-muted-foreground">Preparing your document</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @media print {
            .no-print {
              display: none !important;
            }
            .print-only {
              display: block !important;
            }
            body {
              margin: 0;
              padding: 20px;
            }
            .document-content {
              box-shadow: none !important;
              border: none !important;
              margin: 0 !important;
              padding: 40px !important;
            }
          }
          @media screen {
            .print-only {
              display: none;
            }
          }
        `}
      </style>

      <div className="min-h-screen bg-gray-50">
        {/* Header - Hidden during print */}
        <div className="no-print bg-white border-b sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/documents')}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">{documentData.templateName}</h1>
                  <p className="text-muted-foreground">For: {documentData.residentName}</p>
                </div>
              </div>
              
              <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90">
                <Printer className="h-4 w-4 mr-2" />
                Print Document
              </Button>
            </div>
          </div>
        </div>

        {/* Document Content */}
        <div className="max-w-4xl mx-auto p-6">
          <Card className="document-content bg-white shadow-lg">
            <CardContent className="p-12">
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: documentData.content }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Print Instructions - Hidden during print */}
        <div className="no-print max-w-4xl mx-auto px-6 pb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Print Instructions</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Click the "Print Document" button or use Ctrl+P (Cmd+P on Mac)</li>
              <li>• Make sure to select "More settings" and choose A4 paper size</li>
              <li>• For best results, use "Normal" or "More" print quality</li>
              <li>• The document will print without headers, footers, or navigation elements</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default DocumentPreviewPage;
