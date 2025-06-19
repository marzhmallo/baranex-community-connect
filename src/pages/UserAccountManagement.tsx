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
import { Crown, Shield, User, Info, Users, Search, Eye, Check, X, Mail, AlertTriangle, Edit, MoreVertical, UserX, Play, Blocks } from 'lucide-react';

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
    
    return matchesSearch;
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
    const statusConfig = {
      pending: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-200', dot: 'bg-amber-500' },
      approved: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200', dot: 'bg-green-500' },
      rejected: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200', dot: 'bg-red-500' },
      blocked: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200', dot: 'bg-red-500' },
      active: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200', dot: 'bg-green-500' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center gap-1 ${config.bg} ${config.text} px-3 py-1 rounded-full text-sm font-medium`}>
        <span className={`w-2 h-2 ${config.dot} rounded-full`}></span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getRoleBadge = (role: string, isSuperior: boolean = false) => {
    const roleConfig = {
      admin: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200' },
      staff: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200' },
      user: { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-800 dark:text-gray-200' }
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.user;
    
    if (isSuperior) {
      return (
        <span className="inline-flex items-center gap-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 px-3 py-1 rounded-full text-sm font-medium">
          <Crown className="w-3 h-3" />
          Head Admin
        </span>
      );
    }
    
    return (
      <span className={`inline-flex items-center gap-1 ${config.bg} ${config.text} px-3 py-1 rounded-full text-sm font-medium`}>
        <Shield className="w-3 h-3" />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getGradientColor = (index: number) => {
    const gradients = [
      'from-primary-500 to-primary-600',
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
      'from-indigo-500 to-indigo-600'
    ];
    return gradients[index % gradients.length];
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

  const adminUsers = filteredUsers?.filter(u => u.role === 'admin' || u.role === 'staff') || [];
  const regularUsers = filteredUsers?.filter(u => u.role === 'user') || [];
  const pendingUsers = filteredUsers?.filter(u => u.status === 'pending') || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">User Management System</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage barangay administrators and system users with role-based permissions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-full">
                <Shield className="text-primary-600 dark:text-primary-400 h-6 w-6" />
              </div>
              <span className="text-2xl font-bold text-slate-800 dark:text-slate-200">{adminUsers.length}</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">Admins</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Barangay administrators with privileges</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                <Users className="text-blue-600 dark:text-blue-400 h-6 w-6" />
              </div>
              <span className="text-2xl font-bold text-slate-800 dark:text-slate-200">{regularUsers.length}</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">Users</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Regular users</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full">
                <AlertTriangle className="text-amber-600 dark:text-amber-400 h-6 w-6" />
              </div>
              <span className="text-2xl font-bold text-slate-800 dark:text-slate-200">{pendingUsers.length}</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">Pending Approval</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Users awaiting verification</p>
          </div>
        </div>

        {/* Main Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">User Management Dashboard</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700 dark:text-slate-300">User</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700 dark:text-slate-300">Role</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700 dark:text-slate-300">Joined</th>
                  <th className="text-center py-4 px-6 font-semibold text-slate-700 dark:text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredUsers?.map((user, index) => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 bg-gradient-to-br ${getGradientColor(index)} rounded-full flex items-center justify-center text-white font-semibold`}>
                          {getInitials(user.firstname, user.lastname)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {user.firstname} {user.lastname}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {getRoleBadge(user.role || 'user', user.superior_admin)}
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(user.status || 'pending')}
                    </td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-400">
                      {new Date(user.created_at || '').toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedUser(user)}
                              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-full"
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
                                      {getInitials(selectedUser.firstname, selectedUser.lastname)}
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
                                    <p>{getRoleBadge(selectedUser.role || 'user', selectedUser.superior_admin)}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium">Status:</span>
                                    <p>{getStatusBadge(selectedUser.status || 'pending')}</p>
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
                              className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateUserStatus(user.id, 'rejected')}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        
                        {user.superior_admin ? (
                          <Badge variant="outline" className="text-xs">
                            Protected
                          </Badge>
                        ) : canModifyUser(user) ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-2 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-full"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Protected
                          </Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Showing {filteredUsers?.length || 0} users
              </div>
            </div>
          </div>
        </div>

        {/* Guidelines Section */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-primary-50 dark:from-blue-900/20 dark:to-primary-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full flex-shrink-0">
              <Info className="text-blue-600 dark:text-blue-400 h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">User Management Guidelines</h3>
              <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary-500 rounded-full"></span>
                  Head Admins are barangay founders with permanent protection from removal or suspension
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary-500 rounded-full"></span>
                  Regular admins can be managed by Head Admins within their respective barangays
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary-500 rounded-full"></span>
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
                  {users?.filter(u => (u.role === 'admin' || u.role === 'staff') && !u.superior_admin).map(user => (
                    <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {getInitials(user.firstname, user.lastname)}
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
    </div>
  );
};

export default UserAccountManagement;
