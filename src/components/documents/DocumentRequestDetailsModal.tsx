import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  User, 
  FileText, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

interface DocumentRequestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: any;
  onApprove: (id: string, name: string) => void;
  onDeny: (id: string, name: string) => void;
}

const DocumentRequestDetailsModal = ({
  isOpen,
  onClose,
  request,
  onApprove,
  onDeny
}: DocumentRequestDetailsModalProps) => {
  if (!request) return null;

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50"><AlertCircle className="h-3 w-3 mr-1" />Processing</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatus = () => {
    if (request.paydate && request.paymenturl) {
      return <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50"><CreditCard className="h-3 w-3 mr-1" />Paid</Badge>;
    }
    return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50"><CreditCard className="h-3 w-3 mr-1" />Unpaid</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Request Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Request Overview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Request Overview</span>
                {getStatusBadge(request.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Document Number</p>
                  <p className="font-mono text-sm bg-muted px-2 py-1 rounded">{request.docnumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Document Type</p>
                  <p className="font-medium">{request.document}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Purpose</p>
                <p className="text-sm bg-muted p-2 rounded">{request.purpose}</p>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Requested {request.timeAgo}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requester Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Requester Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium text-primary">
                    {request.name.split(' ').map((n: string) => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-lg">{request.name}</p>
                  <p className="text-sm text-muted-foreground">Resident</p>
                </div>
              </div>
              
              {/* Additional contact info can be added here if available */}
              <div className="grid grid-cols-1 gap-2 pt-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>Contact information not available</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Information
                </div>
                {getPaymentStatus()}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount</p>
                  <p className="font-medium">₱{request.amount || '0.00'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                  <p className="font-medium">{request.method || 'Not specified'}</p>
                </div>
              </div>
              
              {request.paydate && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Date</p>
                  <p className="font-medium">{new Date(request.paydate).toLocaleDateString()}</p>
                </div>
              )}

              {request.paymenturl && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Proof</p>
                  <a 
                    href={request.paymenturl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                  >
                    View Payment Screenshot
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {request.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm bg-muted p-3 rounded">{request.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <Separator />

        {/* Action Buttons */}
        {request.status === 'pending' && (
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                onDeny(request.id, request.name);
                onClose();
              }}
              className="bg-red-50 hover:bg-red-100 border-red-200 text-red-700 hover:text-red-800"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Deny Request
            </Button>
            <Button
              onClick={() => {
                onApprove(request.id, request.name);
                onClose();
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve Request
            </Button>
          </div>
        )}
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentRequestDetailsModal;