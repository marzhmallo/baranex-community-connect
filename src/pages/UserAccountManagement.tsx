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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { Crown, Shield, User, Info, Users, Search, Eye, Check, X, Mail, AlertTriangle, Edit, MoreVertical, UserX, Play, Blocks, ZoomIn, KeyRound, Trash2, Settings } from 'lucide-react';
import CachedAvatar from '@/components/ui/CachedAvatar';
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
  profile_picture?: string;
}
const UserAccountManagement = () => {
  const {
    userProfile
  } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [photoViewOpen, setPhotoViewOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [changeRoleDialogOpen, setChangeRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [banUserDialogOpen, setBanUserDialogOpen] = useState(false);
  const [adminRoleConfirmOpen, setAdminRoleConfirmOpen] = useState(false);
  const {
    data: users,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['users', userProfile?.brgyid],
    queryFn: async () => {
      if (!userProfile?.brgyid) {
        console.log('No barangay ID available for filtering');
        return [];
      }
      console.log('Fetching users for barangay:', userProfile.brgyid);
      const {
        data,
        error
      } = await supabase.from('profiles').select('*').eq('brgyid', userProfile.brgyid).in('role', ['user', 'admin']).order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
      console.log('Fetched users:', data);
      return data as UserProfile[];
    },
    enabled: !!userProfile?.brgyid
  });
  const filteredUsers = users?.filter(user => {
    const matchesSearch = user.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) || user.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) || user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });
  const updateUserStatus = async (userId: string, status: string, reason?: string) => {
    // Check if the target user is a superior admin
    const targetUser = users?.find(u => u.id === userId);
    if (targetUser?.superior_admin && !userProfile?.superior_admin) {
      toast({
        title: "Access Denied",
        description: "You cannot modify a superior admin's status",
        variant: "destructive"
      });
      return;
    }

    const updateData: any = { status };
    
    // If rejecting and reason provided, add to notes
    if (status === 'rejected' && reason) {
      updateData.notes = {
        rejection_reason: reason,
        rejected_at: new Date().toISOString(),
        rejected_by: userProfile?.id
      };
    }

    const {
      error
    } = await supabase.from('profiles').update(updateData).eq('id', userId).eq('brgyid', userProfile?.brgyid); // Additional security check

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: `User status updated to ${status}`
      });
      refetch();
    }
  };
  const transferSuperiority = async (newSuperiorId: string) => {
    if (!userProfile?.superior_admin) {
      toast({
        title: "Access Denied",
        description: "Only superior admins can transfer superiority",
        variant: "destructive"
      });
      return;
    }

    // Start a transaction to update both users
    const {
      error: removeError
    } = await supabase.from('profiles').update({
      superior_admin: false
    }).eq('id', userProfile.id);
    if (removeError) {
      toast({
        title: "Error",
        description: "Failed to transfer superiority",
        variant: "destructive"
      });
      return;
    }
    const {
      error: assignError
    } = await supabase.from('profiles').update({
      superior_admin: true
    }).eq('id', newSuperiorId);
    if (assignError) {
      // Rollback the previous change
      await supabase.from('profiles').update({
        superior_admin: true
      }).eq('id', userProfile.id);
      toast({
        title: "Error",
        description: "Failed to transfer superiority",
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Success",
      description: "Superiority transferred successfully. Please log in again."
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

  const changeUserRole = async (userId: string, newRole: string) => {
    const targetUser = users?.find(u => u.id === userId);
    if (targetUser?.superior_admin && !userProfile?.superior_admin) {
      toast({
        title: "Access Denied",
        description: "You cannot modify a superior admin's role",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
      .eq('brgyid', userProfile?.brgyid);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: `User role updated to ${newRole}`
      });
      setChangeRoleDialogOpen(false);
      setNewRole('');
      refetch();
    }
  };

  const deleteUser = async (userId: string) => {
    const targetUser = users?.find(u => u.id === userId);
    if (targetUser?.superior_admin) {
      toast({
        title: "Access Denied",
        description: "Cannot delete a superior admin",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)
      .eq('brgyid', userProfile?.brgyid);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "User deleted successfully"
      });
      setDeleteUserDialogOpen(false);
      setUserDetailsOpen(false);
      refetch();
    }
  };

  const lockAccount = async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ padlock: true } as any)
      .eq('id', userId);
    
    if (error) {
      console.error('Lock account error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to lock account",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Account locked successfully"
      });
      refetch();
    }
  };
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        dot: 'bg-amber-500',
        border: 'border-amber-200'
      },
      approved: {
        bg: 'bg-green-50',
        text: 'text-green-700',
        dot: 'bg-green-500',
        border: 'border-green-200'
      },
      rejected: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        dot: 'bg-red-500',
        border: 'border-red-200'
      },
      blocked: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        dot: 'bg-red-500',
        border: 'border-red-200'
      },
      active: {
        bg: 'bg-green-50',
        text: 'text-green-700',
        dot: 'bg-green-500',
        border: 'border-green-200'
      }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <span className={`inline-flex items-center gap-1 ${config.bg} ${config.text} ${config.border} border px-3 py-1 rounded-full text-sm font-medium`}>
        <span className={`w-2 h-2 ${config.dot} rounded-full`}></span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>;
  };
  const getRoleBadge = (role: string, isSuperior: boolean = false) => {
    if (isSuperior) {
      return <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 rounded-full text-sm font-medium">
          <Crown className="w-3 h-3" />
          Superior Admin
        </span>;
    }
    const roleConfig = {
      admin: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        icon: Shield
      },
      staff: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        icon: Shield
      },
      user: {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-200',
        icon: User
      }
    };
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.user;
    const IconComponent = config.icon;
    return <span className={`inline-flex items-center gap-1 ${config.bg} ${config.text} ${config.border} border px-3 py-1 rounded-full text-sm font-medium`}>
        <IconComponent className="w-3 h-3" />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>;
  };
  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };
  const getGradientColor = (index: number) => {
    const gradients = ['from-primary-500 to-primary-600', 'from-blue-500 to-blue-600', 'from-green-500 to-green-600', 'from-purple-500 to-purple-600', 'from-pink-500 to-pink-600', 'from-indigo-500 to-indigo-600'];
    return gradients[index % gradients.length];
  };
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>;
  }
  if (!userProfile?.brgyid) {
    return <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
              <p className="text-muted-foreground">No barangay assignment found. Please contact your administrator.</p>
            </div>
          </CardContent>
        </Card>
      </div>;
  }
  const adminUsers = filteredUsers?.filter(u => u.role === 'admin') || [];
  const regularUsers = filteredUsers?.filter(u => u.role === 'user') || [];
  const pendingUsers = filteredUsers?.filter(u => u.status === 'pending') || [];
  return <div className="min-h-screen bg-background p-8">
      <div className="mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">User Management System</h1>
          <p className="text-muted-foreground">Manage barangay administrators and system users with role-based permissions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-full">
                <Shield className="text-purple-600 dark:text-purple-400 h-6 w-6" />
              </div>
              <span className="text-2xl font-bold text-foreground">{adminUsers.length}</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Admins</h3>
            <p className="text-muted-foreground text-sm">Barangay administrators with privileges</p>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-full">
                <Users className="text-blue-600 dark:text-blue-400 h-6 w-6" />
              </div>
              <span className="text-2xl font-bold text-foreground">{regularUsers.length}</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Users</h3>
            <p className="text-muted-foreground text-sm">Regular users</p>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-full">
                <AlertTriangle className="text-amber-600 dark:text-amber-400 h-6 w-6" />
              </div>
              <span className="text-2xl font-bold text-foreground">{pendingUsers.length}</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Pending Approval</h3>
            <p className="text-muted-foreground text-sm">Users awaiting verification</p>
          </div>
        </div>

        {/* Main Table */}
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="p-6 border-b border-border">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-xl font-semibold text-foreground">User Management Dashboard</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Input type="text" placeholder="Search users..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 w-full sm:w-64" />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-foreground">User</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground">Role</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground">Joined</th>
                  <th className="text-center py-4 px-6 font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers?.map((user, index) => <tr key={user.id} className="hover:bg-muted/50 transition-colors duration-200">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <CachedAvatar userId={user.id} profilePicture={user.profile_picture} fallback={getInitials(user.firstname, user.lastname)} className="w-10 h-10" />
                        <div>
                          <div className="font-semibold text-foreground">
                            {user.firstname} {user.lastname}
                          </div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {getRoleBadge(user.role || 'user', user.superior_admin)}
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(user.status || 'pending')}
                    </td>
                    <td className="py-4 px-6 text-muted-foreground">
                      {new Date(user.created_at || '').toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        {/* View button */}
                        <Button variant="ghost" size="sm" onClick={() => {
                      setSelectedUser(user);
                      setUserDetailsOpen(true);
                    }} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full">
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {/* Approval buttons for pending users */}
                        {user.status === 'pending' && canModifyUser(user) && <>
                            
                            
                          </>}
                        
                        {/* Protected badge or action buttons */}
                         <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full border border-border">
                            {user.superior_admin ? 'Protected' : 'User'}
                          </span>
                      </div>
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>

          <div className="p-6 border-t border-border bg-muted/50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Showing {filteredUsers?.length || 0} users
              </div>
            </div>
          </div>
        </div>

        {/* Guidelines Section */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 dark:bg-blue-800/50 p-3 rounded-full flex-shrink-0">
              <Info className="text-blue-600 dark:text-blue-400 h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">User Management Guidelines</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  Superior Admins are barangay founders with permanent protection from removal or suspension
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  Regular admins can be managed by Superior Admins within their respective barangays
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  All user actions are logged and auditable for security compliance
                </li>
              </ul>
            </div>
          </div>
        </div>

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
                  {users?.filter(u => (u.role === 'admin' || u.role === 'staff') && !u.superior_admin).map(user => <div key={user.id} className="flex items-center justify-between p-2 border border-border rounded">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {getInitials(user.firstname, user.lastname)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{user.firstname} {user.lastname}</span>
                        <span className="text-xs text-muted-foreground">({user.email})</span>
                      </div>
                      <Button size="sm" onClick={() => transferSuperiority(user.id)}>
                        Transfer
                      </Button>
                    </div>)}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* User Details Modal */}
        <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Profile Details
              </DialogTitle>
            </DialogHeader>
            {selectedUser && <div className="space-y-6">
                {/* User Header */}
                <div className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg">
                  <div className="relative group cursor-pointer" onClick={() => setPhotoViewOpen(true)}>
                    <CachedAvatar userId={selectedUser.id} profilePicture={selectedUser.profile_picture} fallback={getInitials(selectedUser.firstname, selectedUser.lastname)} className="w-16 h-16" />
                    {selectedUser.profile_picture && <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full flex items-center justify-center">
                        <ZoomIn className="h-5 w-5 text-white" />
                      </div>}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-1">
                      {selectedUser.firstname} {selectedUser.middlename ? `${selectedUser.middlename} ` : ''}{selectedUser.lastname}
                    </h3>
                    <p className="text-muted-foreground mb-2">{selectedUser.email}</p>
                    <div className="flex gap-2">
                      {getRoleBadge(selectedUser.role || 'user', selectedUser.superior_admin)}
                      {getStatusBadge(selectedUser.status || 'pending')}
                    </div>
                  </div>
                </div>

                {/* User Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-foreground border-b border-border pb-2">Personal Information</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                        <p className="text-foreground">{selectedUser.firstname} {selectedUser.middlename} {selectedUser.lastname}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                        <p className="text-foreground">{selectedUser.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                        <p className="text-foreground">{selectedUser.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Username</label>
                        <p className="text-foreground">{selectedUser.username || 'Not set'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-foreground border-b border-border pb-2">System Information</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">User Role</label>
                        <div className="mt-1">{getRoleBadge(selectedUser.role || 'user', selectedUser.superior_admin)}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Account Status</label>
                        <div className="mt-1">{getStatusBadge(selectedUser.status || 'pending')}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Purok/Zone</label>
                        <p className="text-foreground">{selectedUser.purok || 'Not assigned'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                        <p className="text-foreground">{new Date(selectedUser.created_at || '').toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Notice */}
                {selectedUser.superior_admin && <Alert className="border-purple-200 bg-purple-50 dark:bg-purple-900/20">
                    <Crown className="h-4 w-4 text-purple-600" />
                    <AlertDescription className="text-purple-700 dark:text-purple-300">
                      This user is a <strong>Superior Administrator</strong> with elevated privileges and cannot be modified by other administrators.
                    </AlertDescription>
                  </Alert>}

                {/* Context-Aware Action Bar */}
                <div className="space-y-4 pt-4 border-t border-border">
                  {/* Main Actions based on Status */}
                  <div className="flex flex-wrap gap-3">
                    {selectedUser.status === 'pending' && canModifyUser(selectedUser) && (
                      <>
                        <Button onClick={() => {
                          updateUserStatus(selectedUser.id, 'approved');
                          setUserDetailsOpen(false);
                        }} className="flex-1 min-w-[120px]">
                          <Check className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button variant="destructive" onClick={() => {
                          setRejectionDialogOpen(true);
                        }} className="flex-1 min-w-[120px]">
                          <X className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    )}
                    
                    {selectedUser.status === 'approved' && canModifyUser(selectedUser) && (
                      <>
                        <Button variant="outline" className="flex-1 min-w-[120px]">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                        <Button variant="outline" onClick={() => {
                          window.location.href = `mailto:${selectedUser.email}`;
                        }} className="flex-1 min-w-[120px]">
                          <Mail className="h-4 w-4 mr-2" />
                          Send Email
                        </Button>
                      </>
                    )}
                    
                    {(selectedUser.status === 'blocked' || selectedUser.status === 'banned') && canModifyUser(selectedUser) && (
                      <Button onClick={() => {
                        updateUserStatus(selectedUser.id, 'approved');
                        setUserDetailsOpen(false);
                      }} className="flex-1 min-w-[160px]">
                        <Play className="h-4 w-4 mr-2" />
                        Unban User
                      </Button>
                    )}
                  </div>

                  {/* More Options - Removed since dropdown is now in table */}
                </div>
              </div>}
          </DialogContent>
        </Dialog>

        {/* Rejection Reason Dialog */}
        <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <X className="h-5 w-5 text-destructive" />
                Reject User Account
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Rejection Reason</Label>
                <Input
                  id="rejection-reason"
                  placeholder="e.g., ID was unclear, Name does not match ID"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setRejectionDialogOpen(false);
                    setRejectionReason('');
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={() => {
                    if (selectedUser) {
                      updateUserStatus(selectedUser.id, 'rejected', rejectionReason);
                      setUserDetailsOpen(false);
                      setRejectionDialogOpen(false);
                      setRejectionReason('');
                    }
                  }}
                >
                  Reject User
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Change Role Dialog */}
        <Dialog open={changeRoleDialogOpen} onOpenChange={setChangeRoleDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Change User Role
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-role">New Role</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setChangeRoleDialogOpen(false);
                    setNewRole('');
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => {
                    if (selectedUser && newRole) {
                      // Check if promoting to admin - show additional confirmation
                      if (newRole === 'admin') {
                        setAdminRoleConfirmOpen(true);
                      } else {
                        changeUserRole(selectedUser.id, newRole);
                      }
                    }
                  }}
                  disabled={!newRole}
                >
                  Change Role
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Admin Role Confirmation Dialog */}
        <AlertDialog open={adminRoleConfirmOpen} onOpenChange={setAdminRoleConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Promote to Administrator
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to promote <strong>{selectedUser?.firstname} {selectedUser?.lastname}</strong> to Administrator? 
                This will grant them elevated privileges including the ability to manage other users, access sensitive data, and modify system settings.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setAdminRoleConfirmOpen(false);
                setNewRole('');
              }}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  if (selectedUser && newRole) {
                    changeUserRole(selectedUser.id, newRole);
                    setAdminRoleConfirmOpen(false);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Promote to Admin
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Ban User Confirmation Dialog */}
        <AlertDialog open={banUserDialogOpen} onOpenChange={setBanUserDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-orange-600" />
                Ban User Account
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to ban <strong>{selectedUser?.firstname} {selectedUser?.lastname}</strong>? 
                This action will block their access to the system. You can unban them later if needed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  if (selectedUser) {
                    updateUserStatus(selectedUser.id, 'banned');
                    setBanUserDialogOpen(false);
                    setUserDetailsOpen(false);
                  }
                }}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Ban User
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete User Confirmation Dialog */}
        <AlertDialog open={deleteUserDialogOpen} onOpenChange={setDeleteUserDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                Delete User Account
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete <strong>{selectedUser?.firstname} {selectedUser?.lastname}</strong>? 
                This action cannot be undone and will remove all their data from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  if (selectedUser) {
                    deleteUser(selectedUser.id);
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete User
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Photo View Dialog */}
        <Dialog open={photoViewOpen} onOpenChange={setPhotoViewOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Picture
              </DialogTitle>
            </DialogHeader>
            {selectedUser && <div className="flex flex-col items-center space-y-4">
                <CachedAvatar userId={selectedUser.id} profilePicture={selectedUser.profile_picture} fallback={getInitials(selectedUser.firstname, selectedUser.lastname)} className="w-64 h-64" />
                <div className="text-center">
                  <h3 className="font-semibold text-foreground">
                    {selectedUser.firstname} {selectedUser.lastname}
                  </h3>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>}
          </DialogContent>
        </Dialog>
      </div>
    </div>;
};
export default UserAccountManagement;