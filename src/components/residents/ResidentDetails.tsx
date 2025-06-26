import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, X, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Resident {
  id: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix: string;
  birthdate: string;
  gender: string;
  marital_status: string;
  occupation: string;
  email: string;
  contact_number: string;
  address: string;
  barangay: string;
  province: string;
  region: string;
  nationality: string;
  is_voter: boolean;
  photo_url: string;
  status: string;
  remarks: string;
}

import IssueDocumentModal from "@/components/documents/IssueDocumentModal";

const ResidentDetails = ({ resident, onClose, onEdit }) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [age, setAge] = useState(null);
  const { toast } = useToast();
  const [showIssueDocument, setShowIssueDocument] = useState(false);

  useEffect(() => {
    if (resident?.birthdate) {
      const birthDate = new Date(resident.birthdate);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const month = today.getMonth() - birthDate.getMonth();
      if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      setAge(calculatedAge);
    }
  }, [resident]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Invalid Date';
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {resident.first_name?.[0]}{resident.last_name?.[0]}
                  </div>
                  {resident.photo_url && (
                    <img 
                      src={resident.photo_url} 
                      alt="Resident"
                      className="absolute inset-0 w-full h-full rounded-full object-cover"
                    />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {resident.first_name} {resident.middle_name} {resident.last_name} {resident.suffix}
                  </h2>
                  <p className="text-gray-600">Resident ID: {resident.id?.slice(0, 8)}...</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={resident.status === 'Active' ? 'default' : 'secondary'}>
                      {resident.status}
                    </Badge>
                    {resident.is_voter && <Badge variant="outline">Voter</Badge>}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setShowIssueDocument(true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Issue Document
                </Button>
                <Button onClick={onEdit} variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button onClick={onClose} variant="outline" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="additional">Additional Info</TabsTrigger>
              </TabsList>
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Details about the resident's identity.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Full Name:</p>
                        <p className="text-gray-900">{resident.first_name} {resident.middle_name} {resident.last_name} {resident.suffix}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Birthdate:</p>
                        <p className="text-gray-900">{formatDate(resident.birthdate)} ({age} years old)</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Gender:</p>
                        <p className="text-gray-900">{resident.gender}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Marital Status:</p>
                        <p className="text-gray-900">{resident.marital_status}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Address:</p>
                      <p className="text-gray-900">{resident.address}, {resident.barangay}, {resident.province}, {resident.region}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="contact">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>Details for contacting the resident.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Email:</p>
                      <p className="text-gray-900">{resident.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Contact Number:</p>
                      <p className="text-gray-900">{resident.contact_number || 'N/A'}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="additional">
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Information</CardTitle>
                    <CardDescription>Other relevant details about the resident.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Occupation:</p>
                        <p className="text-gray-900">{resident.occupation || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Nationality:</p>
                        <p className="text-gray-900">{resident.nationality || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Voter Status:</p>
                        <p className="text-gray-900">{resident.is_voter ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Status:</p>
                        <p className="text-gray-900">{resident.status || 'N/A'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Remarks:</p>
                      <p className="text-gray-900">{resident.remarks || 'N/A'}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Issue Document Modal */}
      <IssueDocumentModal
        open={showIssueDocument}
        onOpenChange={setShowIssueDocument}
        resident={resident}
      />
    </>
  );
};

export default ResidentDetails;
