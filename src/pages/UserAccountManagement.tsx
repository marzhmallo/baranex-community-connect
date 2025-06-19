import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { Search, Eye, Check, X, Mail, AlertTriangle, Crown, Edit, Trash2, Users } from 'lucide-react';

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
  username?: string;
  purok?: string;
  middlename?: string;
  created_at?: string;
}

const UserAccountManagement = () => {
  const { userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);

  const { data: users, isLoading, error, refetch } = useQuery({
    queryKey: ['users', userProfile?.brgyid],
    queryFn: async () => {
      if (!userProfile?.brgyid) {
        console.log('No barangay ID available for filtering');
        return [];
      }

      console.log('Fetching users for barangay:', userProfile.brgyid);
      console.log('Current user profile:', userProfile);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('brgyid', userProfile.brgyid);
      
      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
      
      console.log('Fetched all users:', data);
      console.log('Total users found:', data?.length || 0);
      
      // Filter out current user from the list for admin accounts section
      const filteredUsers = data?.filter(user => user.id !== userProfile.id) || [];
      console.log('Users excluding current admin:', filteredUsers);
      
      return data as UserProfile[];
    },
    enabled: !!userProfile?.brgyid && !!userProfile?.id,
  });

  // Log the users data whenever it changes
  useEffect(() => {
    console.log('Users data updated:', users);
    console.log('Is loading:', isLoading);
    console.log('Error:', error);
  }, [users, isLoading, error]);

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
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className: string }> = {
      pending: { variant: "outline", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
      approved: { variant: "default", className: "bg-green-500/10 text-green-600 border-green-500/20" },
      rejected: { variant: "destructive", className: "bg-red-500/10 text-red-600 border-red-500/20" },
      blocked: { variant: "secondary", className: "bg-gray-500/10 text-gray-600 border-gray-500/20" }
    };
    
    const config = variants[status] || variants.pending;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getRoleBadge = (role: string, isSuperior: boolean = false) => {
    const colors: Record<string, string> = {
      admin: "bg-purple-500/10 text-purple-600 border-purple-500/20",
      staff: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      user: "bg-green-500/10 text-green-600 border-green-500/20"
    };
    
    return (
      <div className="flex items-center gap-2">
        <Badge className={colors[role] || "bg-gray-500/10 text-gray-600 border-gray-500/20"}>
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </Badge>
        {isSuperior && (
          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            <Crown className="h-3 w-3 mr-1" />
            Superior
          </Badge>
        )}
      </div>
    );
  };

  // Filter users based on search
  const filteredUsers = users?.filter(user => {
    const matchesSearch = 
      user.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Categorize users
  const superiorAdmins = filteredUsers?.filter(user => user.superior_admin) || [];
  const adminUsers = filteredUsers?.filter(user => (user.role === 'admin' || user.role === 'staff') && !user.superior_admin) || [];
  const pendingUsers = filteredUsers?.filter(user => user.status === 'pending') || [];
  const blockedUsers = filteredUsers?.filter(user => user.status === 'blocked') || [];

  console.log('Categorized users:', {
    all: filteredUsers?.length || 0,
    superior: superiorAdmins.length,
    admin: adminUsers.length,
    pending: pendingUsers.length,
    blocked: blockedUsers.length
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    console.error('Query error:', error);
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Users</h3>
              <p className="text-muted-foreground mb-4">{error.message}</p>
              <Button onClick={() => refetch()}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userProfile?.brgyid) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
              <p className="text-muted-foreground">No barangay assignment found. Please contact your administrator.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">User Management</h1>
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 bg-card border-border"
          />
        </div>
      </div>

      {/* Main Tab Indicator */}
      <div className="border-b border-border">
        <div className="bg-primary/10 text-primary px-3 py-1 rounded-t-md inline-block font-medium text-sm">
          MAIN
        </div>
      </div>

      {/* Debug Info */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            Debug: Found {users?.length || 0} total users, {superiorAdmins.length} superior admins, {adminUsers.length} admin users
          </p>
        </CardContent>
      </Card>

      {/* Barangay Administrators Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Barangay Administrators</h2>
        
        {superiorAdmins.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <p className="text-muted-foreground">No superior administrators found.</p>
            </CardContent>
          </Card>
        ) : (
          superiorAdmins.map((user) => (
            <Card key={user.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-purple-500 text-white">
                        {user.firstname?.[0]}{user.lastname?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-foreground">{user.firstname} {user.lastname}</h3>
                      <p className="text-sm text-muted-foreground">Head Administrator • {userProfile?.brgyid}</p>
                      <p className="text-xs text-muted-foreground">Registered {new Date(user.created_at || '').toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground">Note: Head Administrators cannot be blocked, banned or removed by other administrators.</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Administrator Accounts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Administrator Accounts</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-muted-foreground">{adminUsers.filter(u => u.status === 'approved').length} Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-muted-foreground">{pendingUsers.length} Pending</span>
            </div>
          </div>
        </div>

        {adminUsers.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <p className="text-muted-foreground">No administrator accounts found.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {adminUsers.map((user, index) => (
                <div key={user.id} className={`p-4 flex items-center justify-between ${index < adminUsers.length - 1 ? 'border-b border-border' : ''}`}>
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-blue-500 text-white">
                        {user.firstname?.[0]}{user.lastname?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-foreground">{user.firstname} {user.lastname}</h3>
                        {getStatusBadge(user.status || 'pending')}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.role?.charAt(0).toUpperCase() + user.role?.slice(1)} • {userProfile?.brgyid}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedUser(user)}>
                      <Edit className="h-4 w-4 text-blue-500" />
                    </Button>
                    {user.status === 'pending' && canModifyUser(user) && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => updateUserStatus(user.id, 'approved')}>
                          <Check className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => updateUserStatus(user.id, 'rejected')}>
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recently Blocked Users Section */}
      {blockedUsers.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Recently Blocked Users</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {blockedUsers.map((user) => (
              <Card key={user.id} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gray-500 text-white">
                          {user.firstname?.[0]}{user.lastname?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium text-foreground">{user.firstname} {user.lastname}</h3>
                        <p className="text-sm text-muted-foreground">Blocked on: {new Date(user.created_at || '').toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-purple-500/10 text-purple-600 border-purple-500/20 hover:bg-purple-500/20"
                      onClick={() => updateUserStatus(user.id, 'approved')}
                    >
                      Unblock
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Transfer Superiority Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Transfer Superior Admin Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This action will transfer your superior admin privileges to another admin. You will lose your superior status and the selected admin will become the new superior admin.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Select new superior admin:</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {users?.filter(u => (u.role === 'admin' || u.role === 'staff') && !u.superior_admin).map(user => (
                  <div key={user.id} className="flex items-center justify-between p-2 border border-border rounded bg-card">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {user.firstname?.[0]}{user.lastname?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-foreground">{user.firstname} {user.lastname}</span>
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

      {/* User Details Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{selectedUser?.firstname} {selectedUser?.lastname}</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {selectedUser.firstname?.[0]}{selectedUser.lastname?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-foreground">{selectedUser.firstname} {selectedUser.lastname}</h3>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-foreground">Phone:</span>
                  <p className="text-muted-foreground">{selectedUser.phone || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium text-foreground">Role:</span>
                  <p>{getRoleBadge(selectedUser.role || 'user', selectedUser.superior_admin)}</p>
                </div>
                <div>
                  <span className="font-medium text-foreground">Status:</span>
                  <p>{getStatusBadge(selectedUser.status || 'pending')}</p>
                </div>
                <div>
                  <span className="font-medium text-foreground">Username:</span>
                  <p className="text-muted-foreground">{selectedUser.username || 'N/A'}</p>
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
    </div>
  );
};

export default UserAccountManagement;
