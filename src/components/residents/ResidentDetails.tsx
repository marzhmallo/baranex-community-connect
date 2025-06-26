
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
import { Resident } from '@/lib/types';

interface ResidentDetailsProps {
  resident: Resident;
  onClose: () => void;
  onEdit: () => void;
}

const ResidentDetails = ({ resident, onClose, onEdit }: ResidentDetailsProps) => {
  const [issueDocumentOpen, setIssueDocumentOpen] = useState(false);

  const getFullName = () => {
    const parts = [resident.firstName];
    if (resident.middleName) parts.push(resident.middleName);
    parts.push(resident.lastName);
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

  // Convert from ResidentsList format to IssueDocumentModal format
  const convertResidentForModal = (resident: Resident) => {
    return {
      id: resident.id,
      first_name: resident.firstName,
      last_name: resident.lastName,
      middle_name: resident.middleName,
      address: resident.address,
      birthdate: resident.birthDate,
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
            <AvatarImage src={`https://avatar.iran.liara.run/public/boy?username=${resident.firstName}`} />
            <AvatarFallback>{resident.firstName.charAt(0)}{resident.lastName.charAt(0)}</AvatarFallback>
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
              <p className="text-sm text-muted-foreground">{formatDate(resident.birthDate)}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Gender:</p>
              <p className="text-sm text-muted-foreground">{resident.gender}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Civil Status:</p>
              <p className="text-sm text-muted-foreground">{resident.civilStatus}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Voter Status:</p>
              <p className="text-sm text-muted-foreground">
                {resident.isRegisteredVoter ? <Badge className="bg-green-500 text-white">Registered Voter</Badge> : <Badge className="bg-red-500 text-white">Not Registered</Badge>}
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
            {resident.contactNumber && (
              <div>
                <p className="text-sm font-medium flex items-center gap-1"><Phone className="h-4 w-4 mr-1" /> Contact Number:</p>
                <p className="text-sm text-muted-foreground">{resident.contactNumber}</p>
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
