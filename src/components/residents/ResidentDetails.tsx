
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit, FileText, User, Mail, Phone, MapPin } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import IssueDocumentModal from "@/components/documents/IssueDocumentModal";
import { useState } from "react";

// Database resident type from Supabase
interface DatabaseResident {
  id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  suffix?: string;
  birthdate: string;
  gender: string;
  address?: string;
  mobile_number?: string;
  email?: string;
  occupation?: string;
  civil_status: string;
  is_voter: boolean;
}

// Expected resident interface
interface ExpectedResident {
  id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  suffix?: string;
  birthdate: string;
  gender: string;
  address?: string;
  contact_number?: string;
  email?: string;
  occupation?: string;
  civil_status: string;
  is_registered_voter: boolean;
  mobile_number?: string;
}

interface ResidentDetailsProps {
  resident: DatabaseResident;
  onClose: () => void;
  onEdit: () => void;
}

const ResidentDetails = ({ resident, onClose, onEdit }: ResidentDetailsProps) => {
  const [issueDocumentOpen, setIssueDocumentOpen] = useState(false);

  const getFullName = () => {
    const parts = [resident.first_name];
    if (resident.middle_name) parts.push(resident.middle_name);
    parts.push(resident.last_name);
    if (resident.suffix) parts.push(resident.suffix);
    return parts.join(' ');
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'N/A';
    }
  };

  // Convert from database format to expected format for IssueDocumentModal
  const convertResidentForModal = (resident: DatabaseResident) => {
    return {
      id: resident.id,
      first_name: resident.first_name,
      last_name: resident.last_name,
      middle_name: resident.middle_name,
      address: resident.address,
      birthdate: resident.birthdate,
    };
  };

  return (
    <div>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-2xl font-bold">{getFullName()}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIssueDocumentOpen(true)}>
              <FileText className="mr-2 h-4 w-4" /> Issue Document
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onClose}>
              Close
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={`https://avatar.iran.liara.run/public/boy?username=${resident.first_name}`} />
            <AvatarFallback>{resident.first_name.charAt(0)}{resident.last_name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold">{getFullName()}</h3>
            <p className="text-sm text-muted-foreground">
              {resident.occupation || 'Unemployed'}
            </p>
          </div>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold">Personal Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Birthdate:</p>
              <p className="text-sm text-muted-foreground">{formatDate(resident.birthdate)}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Gender:</p>
              <p className="text-sm text-muted-foreground">{resident.gender}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Civil Status:</p>
              <p className="text-sm text-muted-foreground">{resident.civil_status}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Voter Status:</p>
              <p className="text-sm text-muted-foreground">
                {resident.is_voter ? <Badge className="bg-green-500 text-white">Registered Voter</Badge> : <Badge className="bg-red-500 text-white">Not Registered</Badge>}
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold">Contact Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {resident.address && (
              <div>
                <p className="text-sm font-medium flex items-center gap-1"><MapPin className="h-4 w-4 mr-1" /> Address:</p>
                <p className="text-sm text-muted-foreground">{resident.address}</p>
              </div>
            )}
            {resident.mobile_number && (
              <div>
                <p className="text-sm font-medium flex items-center gap-1"><Phone className="h-4 w-4 mr-1" /> Contact Number:</p>
                <p className="text-sm text-muted-foreground">{resident.mobile_number}</p>
              </div>
            )}
            {resident.email && (
              <div>
                <p className="text-sm font-medium flex items-center gap-1"><Mail className="h-4 w-4 mr-1" /> Email:</p>
                <p className="text-sm text-muted-foreground">{resident.email}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* Issue Document Modal */}
      <IssueDocumentModal
        resident={convertResidentForModal(resident)}
        open={issueDocumentOpen}
        onOpenChange={setIssueDocumentOpen}
      />
    </div>
  );
};

export default ResidentDetails;
