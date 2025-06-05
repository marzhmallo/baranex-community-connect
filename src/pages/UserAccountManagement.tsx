import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { Plus, Edit, Trash2, Shield, User } from 'lucide-react';

interface UserProfile {
  id: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
  brgyid?: string;
  superior_admin?: boolean;
  created_at?: string;
}

const UserAccountManagement = () => {
  const { userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);

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
        .neq('id', userProfile.id) // Exclude current admin from the list
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
      
      console.log('Fetched users:', data);
      return data as UserProfile[];
    },
    enabled: !!userProfile?.brgyid && !!userProfile?.id,
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
    // Check if the target user is a superior admin
    const targetUser = users?.find(u => u.id === userId);
    if (targetUser?.superior_admin && !userProfile?.superior_admin) {
      toast({
        title: "Access Denied",
        description: "You cannot modify a superior admin's status",
        variant: "destructive",
      });
      return;
    }

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

  const transferSuperiority = async (newSuperiorId: string) => {
    if (!userProfile?.superior_admin) {
      toast({
        title: "Access Denied",
        description: "Only superior admins can transfer superiority",
        variant: "destructive",
      });
      return;
    }

    // Start a transaction to update both users
    const { error: removeError } = await supabase
      .from('profiles')
      .update({ superior_admin: false })
      .eq('id', userProfile.id);

    if (removeError) {
      toast({
        title: "Error",
        description: "Failed to transfer superiority",
        variant: "destructive",
      });
      return;
    }

    const { error: assignError } = await supabase
      .from('profiles')
      .update({ superior_admin: true })
      .eq('id', newSuperiorId);

    if (assignError) {
      // Rollback the previous change
      await supabase
        .from('profiles')
        .update({ superior_admin: true })
        .eq('id', userProfile.id);
      
      toast({
        title: "Error",
        description: "Failed to transfer superiority",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Superiority transferred successfully. Please log in again.",
    });
    
    setTransferDialogOpen(false);
    // Force a sign out since their role has changed
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  const canModifyUser = (user: UserProfile) => {
    // Superior admins can modify anyone except other superior admins
    if (userProfile?.superior_admin) {
      return !user.superior_admin || user.id === userProfile.id;
    }
    // Regular admins cannot modify superior admins
    return !user.superior_admin;
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

  const getRoleBadge = (role: string, isSuperior: boolean = false) => {
    const colors: Record<string, string> = {
      admin: "bg-red-100 text-red-800",
      staff: "bg-blue-100 text-blue-800",
      user: "bg-green-100 text-green-800"
    };
    
    return (
      <div className="flex items-center gap-1">
        <Badge className={colors[role] || "bg-gray-100 text-gray-800"}>
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </Badge>
        {isSuperior && (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300">
            <Crown className="h-3 w-3 mr-1" />
            Superior
          </Badge>
        )}
      </div>
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

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Your own account ({userProfile.email}) is not shown in this list for security reasons. To manage your profile, use the Profile section instead.
        </AlertDescription>
      </Alert>

      {userProfile?.superior_admin && (
        <Alert>
          <Crown className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>You are the superior admin of this barangay. You can transfer your superiority to another admin.</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTransferDialogOpen(true)}
            >
              Transfer Superiority
            </Button>
          </AlertDescription>
        </Alert>
      )}

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
                          <TableCell>{getRoleBadge(user.role, user.superior_admin)}</TableCell>
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
                                          <p>{getRoleBadge(selectedUser.role, selectedUser.superior_admin)}</p>
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

                                      {selectedUser.superior_admin && (
                                        <Alert>
                                          <AlertTriangle className="h-4 w-4" />
                                          <AlertDescription>
                                            This user is a superior admin and cannot be modified by other admins.
                                          </AlertDescription>
                                        </Alert>
                                      )}
                                      
                                      <div className="flex space-x-2">
                                        {selectedUser.status === 'pending' && canModifyUser(selectedUser) && (
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
                              
                              {user.status === 'pending' && canModifyUser(user) && (
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
                              
                              {canModifyUser(user) && (
                                <>
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              
                              {!canModifyUser(user) && (
                                <Badge variant="outline" className="text-xs">
                                  Protected
                                </Badge>
                              )}
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

      {/* Transfer Superiority Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Superior Admin Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This action will transfer your superior admin privileges to another admin. You will lose your superior status and the selected admin will become the new superior admin.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <h4 className="font-medium">Select new superior admin:</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {users?.filter(u => (u.role === 'admin' || u.role === 'staff') && !u.superior_admin).map(user => (
                  <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {user.firstname?.[0]}{user.lastname?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{user.firstname} {user.lastname}</span>
                      <span className="text-xs text-muted-foreground">({user.email})</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => transferSuperiority(user.id)}
                    >
                      Transfer
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserAccountManagement;
