
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Eye, Check, X, Edit, Trash2, Mail, Shield, User, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  middlename: string;
  phone: string;
  username: string;
  brgyid: string;
  purok: string;
  role: 'admin' | 'staff' | 'user';
  status: 'pending' | 'approved' | 'rejected' | 'blocked';
  created_at: string;
}

const UserAccountManagement = () => {
  const { userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['users', userProfile?.brgyid],
    queryFn: async () => {
      if (!userProfile?.brgyid) {
        console.log('No barangay ID available for filtering');
        return [];
      }

      console.log('Fetching users for barangay:', userProfile.brgyid);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('brgyid', userProfile.brgyid)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
      
      console.log('Fetched users:', data);
      return data as UserProfile[];
    },
    enabled: !!userProfile?.brgyid,
  });

  const filteredUsers = users?.filter(user => {
    const matchesSearch = 
      user.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = 
      activeTab === 'all' ||
      (activeTab === 'admins' && (user.role === 'admin' || user.role === 'staff')) ||
      (activeTab === 'users' && user.role === 'user') ||
      (activeTab === 'pending' && user.status === 'pending') ||
      (activeTab === 'approved' && user.status === 'approved') ||
      (activeTab === 'blocked' && user.status === 'blocked');
    
    return matchesSearch && matchesTab;
  });

  const updateUserStatus = async (userId: string, status: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', userId)
      .eq('brgyid', userProfile?.brgyid); // Additional security check
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `User status updated to ${status}`,
      });
      refetch();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      approved: "default",
      rejected: "destructive",
      blocked: "secondary"
    };
    
    return (
      <Badge variant={variants[status] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-red-100 text-red-800",
      staff: "bg-blue-100 text-blue-800",
      user: "bg-green-100 text-green-800"
    };
    
    return (
      <Badge className={colors[role] || "bg-gray-100 text-gray-800"}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!userProfile?.brgyid) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
              <p className="text-muted-foreground">No barangay assignment found. Please contact your administrator.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Account Management</h1>
          <p className="text-muted-foreground">Manage user accounts, roles, and permissions for your barangay</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All Users ({users?.length || 0})</TabsTrigger>
                <TabsTrigger value="admins">Admins ({users?.filter(u => u.role === 'admin' || u.role === 'staff').length || 0})</TabsTrigger>
                <TabsTrigger value="users">Users ({users?.filter(u => u.role === 'user').length || 0})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({users?.filter(u => u.status === 'pending').length || 0})</TabsTrigger>
                <TabsTrigger value="approved">Approved ({users?.filter(u => u.status === 'approved').length || 0})</TabsTrigger>
                <TabsTrigger value="blocked">Blocked ({users?.filter(u => u.status === 'blocked').length || 0})</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date Registered</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers?.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {user.firstname?.[0]}{user.lastname?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {user.firstname} {user.lastname}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell>{getStatusBadge(user.status)}</TableCell>
                          <TableCell>
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedUser(user)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>User Details</DialogTitle>
                                  </DialogHeader>
                                  {selectedUser && (
                                    <div className="space-y-4">
                                      <div className="flex items-center space-x-3">
                                        <Avatar className="h-12 w-12">
                                          <AvatarFallback>
                                            {selectedUser.firstname?.[0]}{selectedUser.lastname?.[0]}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <h3 className="font-semibold">
                                            {selectedUser.firstname} {selectedUser.lastname}
                                          </h3>
                                          <p className="text-sm text-muted-foreground">
                                            {selectedUser.email}
                                          </p>
                                        </div>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                          <span className="font-medium">Phone:</span>
                                          <p>{selectedUser.phone || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <span className="font-medium">Role:</span>
                                          <p>{getRoleBadge(selectedUser.role)}</p>
                                        </div>
                                        <div>
                                          <span className="font-medium">Status:</span>
                                          <p>{getStatusBadge(selectedUser.status)}</p>
                                        </div>
                                        <div>
                                          <span className="font-medium">Username:</span>
                                          <p>{selectedUser.username || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <span className="font-medium">Purok:</span>
                                          <p>{selectedUser.purok || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <span className="font-medium">Middle Name:</span>
                                          <p>{selectedUser.middlename || 'N/A'}</p>
                                        </div>
                                      </div>
                                      
                                      <div className="flex space-x-2">
                                        {selectedUser.status === 'pending' && (
                                          <>
                                            <Button
                                              size="sm"
                                              onClick={() => updateUserStatus(selectedUser.id, 'approved')}
                                            >
                                              <Check className="h-4 w-4 mr-1" />
                                              Approve
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="destructive"
                                              onClick={() => updateUserStatus(selectedUser.id, 'rejected')}
                                            >
                                              <X className="h-4 w-4 mr-1" />
                                              Reject
                                            </Button>
                                          </>
                                        )}
                                        <Button size="sm" variant="outline">
                                          <Mail className="h-4 w-4 mr-1" />
                                          Send Email
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                              
                              {user.status === 'pending' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateUserStatus(user.id, 'approved')}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateUserStatus(user.id, 'rejected')}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserAccountManagement;
