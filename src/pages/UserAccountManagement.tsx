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
import UserIDsViewer from '@/components/user/UserIDsViewer';
import { RoleAuditHistory } from '@/components/user/RoleAuditHistory';
import { Textarea } from '@/components/ui/textarea';

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
  bday?: string;
}

const UserAccountManagement = () => {
  const { userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at_desc');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [photoViewOpen, setPhotoViewOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [changeRoleDialogOpen, setChangeRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [roleChangeReason, setRoleChangeReason] = useState('');
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [banUserDialogOpen, setBanUserDialogOpen] = useState(false);
  const [adminRoleConfirmOpen, setAdminRoleConfirmOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [editConfirmDialogOpen, setEditConfirmDialogOpen] = useState(false);
  const [editUserForm, setEditUserForm] = useState({
    firstname: '',
    lastname: '',
    middlename: '',
    email: '',
    phone: '',
    purok: '',
    bday: ''
  });
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // ✅ FIXED: Separate queries to avoid RLS JOIN issues
  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['users', userProfile?.brgyid],
    queryFn: async () => {
      if (!userProfile?.brgyid) {
        console.log('No barangay ID available for filtering');
        return [];
      }
      
      console.log('Fetching users for barangay:', userProfile.brgyid);
      
      // Step 1: Fetch profiles only (no JOIN)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('brgyid', userProfile.brgyid)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }

      console.log('Fetched profiles:', data?.length || 0);

      if (!data || data.length === 0) {
        return [];
      }

      // Step 2: Fetch roles separately
      const userIds = data.map(u => u.id);

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        // Continue without roles rather than failing
      }

      console.log('Fetched roles:', rolesData?.length || 0);

      // Step 3: Map roles to users
      const rolesMap = new Map(
        rolesData?.map(r => [r.user_id, r.role]) || []
      );

      const usersWithRoles = data.map(user => ({
        ...user,
        role: rolesMap.get(user.id) || 'user'
      }));

      console.log('Users with mapped roles:', usersWithRoles.length);
      return usersWithRoles as UserProfile[];
    },
    enabled: !!userProfile?.brgyid
  });

  const filteredAndSortedUsers = users?.filter(user => {
    const matchesSearch = user.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name_asc':
        return `${a.firstname} ${a.lastname}`.localeCompare(`${b.firstname} ${b.lastname}`);
      case 'name_desc':
        return `${b.firstname} ${b.lastname}`.localeCompare(`${a.firstname} ${a.lastname}`);
      case 'email_asc':
        return (a.email || '').localeCompare(b.email || '');
      case 'email_desc':
        return (b.email || '').localeCompare(a.email || '');
      case 'role_asc':
        const getRolePriority = (user: UserProfile) => {
          if (user.superior_admin) return 0;
          if (user.role === 'admin') return 1;
          return 2;
        };
        return getRolePriority(a) - getRolePriority(b);
      case 'role_desc':
        const getRolePriorityDesc = (user: UserProfile) => {
          if (user.superior_admin) return 2;
          if (user.role === 'admin') return 1;
          return 0;
        };
        return getRolePriorityDesc(a) - getRolePriorityDesc(b);
      case 'status_asc':
        return (a.status || '').localeCompare(b.status || '');
      case 'status_desc':
        return (b.status || '').localeCompare(a.status || '');
      case 'created_at_asc':
        return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
      case 'created_at_desc':
      default:
        return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
    }
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

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .eq('brgyid', userProfile?.brgyid); // Additional security check

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
    const { error: removeError } = await supabase
      .from('profiles')
      .update({ superior_admin: false })
      .eq('id', userProfile.id);

    if (removeError) {
      toast({
        title: "Error",
        description: "Failed to transfer superiority",
        variant: "destructive"
      });
      return;
    }

    const { error: assignError } = await supabase
      .from('profiles')
      .update({ superior_admin: true })
      .eq('id', newSuperiorId);

    if (assignError) {
      // Rollback the previous change
      await supabase.from('profiles').update({ superior_admin: true }).eq('id', userProfile.id);
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

  const changeUserRole = async (userId: string, newRole: string, reason?: string) => {
    const targetUser = users?.find(u => u.id === userId);
    if (targetUser?.superior_admin && !userProfile?.superior_admin) {
      toast({
        title: "Access Denied",
        description: "You cannot modify a superior admin's role",
        variant: "destructive"
      });
      return;
    }

    // Get current roles to determine old_role
    const { data: currentRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    const oldRole = currentRoles?.[0]?.role || 'user';

    // Remove old roles
    if (currentRoles && currentRoles.length > 0) {
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
    }

    // Add new role
    const { error } = await supabase
      .from('user_roles')
      .insert({ 
        user_id: userId, 
        role: newRole as any
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      });
      return;
    }

    // Create audit log entry manually (no trigger needed)
    await supabase
      .from('role_audit_log')
      .insert({
        user_id: userId,
        old_role: oldRole as any,
        new_role: newRole as any,
        changed_by: userProfile?.id,
        reason: reason || null
      });

    toast({
      title: "Success",
      description: `User role updated to ${newRole}`
    });
    setChangeRoleDialogOpen(false);
    setNewRole('');
    setRoleChangeReason('');
    refetch(); // ✅ This will refresh the data with the new role
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
    
    // Use Edge Function to delete both auth user and profile
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId },
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      setDeleteUserDialogOpen(false);
      setUserDetailsOpen(false);
      setDeleteConfirmText('');
      refetch();
    } catch (err: any) {
      console.error('Delete user error:', err);
      toast({
        title: "Error",
        description: err?.message || 'Failed to delete user',
        variant: "destructive",
      });
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

  const updateUserInfo = async (userId: string) => {
    const targetUser = users?.find(u => u.id === userId);
    if (targetUser?.superior_admin && !userProfile?.superior_admin) {
      toast({
        title: "Access Denied",
        description: "You cannot modify a superior admin's information",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        firstname: editUserForm.firstname,
        lastname: editUserForm.lastname,
        middlename: editUserForm.middlename,
        purok: editUserForm.purok,
        bday: editUserForm.bday || null
      })
      .eq('id', userId)
      .eq('brgyid', userProfile?.brgyid);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update user information",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "User information updated successfully"
      });
      setEditUserDialogOpen(false);
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
    return (
      <span className={`inline-flex items-center gap-1 ${config.bg} ${config.text} ${config.border} border px-3 py-1 rounded-full text-sm font-medium`}>
        <span className={`w-2 h-2 ${config.dot} rounded-full`}></span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getRoleBadge = (role: string, isSuperior: boolean = false) => {
    if (isSuperior) {
      return (
        <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 rounded-full text-sm font-medium">
          <Crown className="w-3 h-3" />
          Superior Admin
        </span>
      );
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
    return (
      <span className={`inline-flex items-center gap-1 ${config.bg} ${config.text} ${config.border} border px-3 py-1 rounded-full text-sm font-medium`}>
        <IconComponent className="w-3 h-3" />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getGradientColor = (index: number) => {
    const gradients = ['from-primary-500 to-primary-600', 'from-blue-500 to-blue-600', 'from-green-500 to-green-600', 'from-purple-500 to-purple-600', 'from-pink-500 to-pink-600', 'from-indigo-500 to-indigo-600'];
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

  const adminUsers = filteredAndSortedUsers?.filter(u => u.role === 'admin') || [];
  const regularUsers = filteredAndSortedUsers?.filter(u => u.role === 'user') || [];
  const pendingUsers = filteredAndSortedUsers?.filter(u => u.status === 'pending') || [];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto">
        {/* ... rest of your JSX remains exactly the same ... */}
        {/* The JSX structure doesn't change, only the data fetching logic was fixed */}
      </div>
    </div>
  );
};

export default UserAccountManagement;
