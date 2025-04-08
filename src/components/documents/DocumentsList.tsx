
import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  Download, 
  MoreVertical, 
  Printer, 
  X, 
  Eye, 
  FileText 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Document types
type DocumentStatus = "pending" | "approved" | "rejected";
type DocumentType = "barangay_clearance" | "business_permit" | "certificate_of_residency" | "indigency_certificate";

interface Document {
  id: string;
  requestedBy: string;
  documentType: DocumentType;
  requestDate: Date;
  status: DocumentStatus;
  urgency: "normal" | "urgent";
}

// Document type labels for display
const documentTypeLabels: Record<DocumentType, string> = {
  barangay_clearance: "Barangay Clearance",
  business_permit: "Business Permit",
  certificate_of_residency: "Certificate of Residency",
  indigency_certificate: "Certificate of Indigency"
};

// Sample documents data
const mockDocuments: Document[] = [
  {
    id: "DOC-2023-001",
    requestedBy: "Juan Dela Cruz",
    documentType: "barangay_clearance",
    requestDate: new Date(2023, 6, 15),
    status: "approved",
    urgency: "normal"
  },
  {
    id: "DOC-2023-002",
    requestedBy: "Maria Santos",
    documentType: "business_permit",
    requestDate: new Date(2023, 6, 18),
    status: "pending",
    urgency: "urgent"
  },
  {
    id: "DOC-2023-003",
    requestedBy: "Pedro Reyes",
    documentType: "certificate_of_residency",
    requestDate: new Date(2023, 6, 20),
    status: "rejected",
    urgency: "normal"
  },
  {
    id: "DOC-2023-004",
    requestedBy: "Ana Gonzales",
    documentType: "indigency_certificate",
    requestDate: new Date(2023, 6, 22),
    status: "pending",
    urgency: "urgent"
  },
  {
    id: "DOC-2023-005",
    requestedBy: "Roberto Lim",
    documentType: "barangay_clearance",
    requestDate: new Date(2023, 6, 25),
    status: "approved",
    urgency: "normal"
  },
  {
    id: "DOC-2023-006",
    requestedBy: "Elena Magtanggol",
    documentType: "business_permit",
    requestDate: new Date(2023, 6, 27),
    status: "approved",
    urgency: "normal"
  },
  {
    id: "DOC-2023-007",
    requestedBy: "Carlos Mendoza",
    documentType: "certificate_of_residency",
    requestDate: new Date(2023, 6, 28),
    status: "pending",
    urgency: "urgent"
  },
  {
    id: "DOC-2023-008",
    requestedBy: "Josephine Cruz",
    documentType: "indigency_certificate",
    requestDate: new Date(2023, 6, 30),
    status: "rejected",
    urgency: "normal"
  }
];

interface DocumentsListProps {
  status: string;
  searchQuery: string;
}

const DocumentsList = ({ status, searchQuery }: DocumentsListProps) => {
  const [documents] = useState<Document[]>(mockDocuments);

  // Filter documents based on status and search query
  const filteredDocuments = documents.filter(doc => {
    const matchesStatus = status === "all" || doc.status === status;
    const matchesSearch = searchQuery === "" || 
      doc.requestedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      documentTypeLabels[doc.documentType].toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-50">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50">Rejected</Badge>;
    }
  };

  const getUrgencyBadge = (urgency: "normal" | "urgent") => {
    return urgency === "urgent" ? 
      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Urgent</Badge> : 
      null;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document ID</TableHead>
            <TableHead>Requested By</TableHead>
            <TableHead>Document Type</TableHead>
            <TableHead>Date Requested</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Urgency</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredDocuments.length > 0 ? (
            filteredDocuments.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">{doc.id}</TableCell>
                <TableCell>{doc.requestedBy}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                    {documentTypeLabels[doc.documentType]}
                  </div>
                </TableCell>
                <TableCell>{formatDistanceToNow(doc.requestDate, { addSuffix: true })}</TableCell>
                <TableCell>{getStatusBadge(doc.status)}</TableCell>
                <TableCell>{getUrgencyBadge(doc.urgency)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="cursor-pointer">
                        <Eye className="mr-2 h-4 w-4" />
                        <span>View Details</span>
                      </DropdownMenuItem>
                      {doc.status === "pending" && (
                        <>
                          <DropdownMenuItem className="cursor-pointer text-green-600">
                            <Check className="mr-2 h-4 w-4" />
                            <span>Approve</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer text-red-600">
                            <X className="mr-2 h-4 w-4" />
                            <span>Reject</span>
                          </DropdownMenuItem>
                        </>
                      )}
                      {doc.status === "approved" && (
                        <>
                          <DropdownMenuItem className="cursor-pointer">
                            <Download className="mr-2 h-4 w-4" />
                            <span>Download</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            <Printer className="mr-2 h-4 w-4" />
                            <span>Print</span>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No documents found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default DocumentsList;
