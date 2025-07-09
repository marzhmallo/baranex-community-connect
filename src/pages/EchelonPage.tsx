import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Gauge, 
  Bell, 
  Building2, 
  MapPin, 
  Users, 
  Settings, 
  User, 
  LogOut,
  Building,
  FileText,
  Check,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PendingApproval {
  id: string;
  lguName: string;
  type: 'Municipality' | 'Barangay';
  contactPerson: string;
  contactEmail: string;
  dateOfRequest: string;
}

const EchelonPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Signed out successfully",
        description: "You have been signed out"
      });
      navigate("/login");
    }
  };

  const pendingApprovals: PendingApproval[] = [
    {
      id: '1',
      lguName: 'Barangay Mankilam',
      type: 'Barangay',
      contactPerson: 'Maria Santos',
      contactEmail: 'msantos@email.com',
      dateOfRequest: '2025-07-08'
    },
    {
      id: '2',
      lguName: 'City of Panabo',
      type: 'Municipality',
      contactPerson: 'Pedro Gomez',
      contactEmail: 'pgomez@email.com',
      dateOfRequest: '2025-07-07'
    }
  ];

  const handleApprove = (approval: PendingApproval) => {
    setSelectedApproval(approval);
    setIsModalOpen(true);
  };

  const handleReject = (approval: PendingApproval) => {
    toast({
      title: "Application Rejected",
      description: `${approval.lguName} registration has been rejected.`,
      variant: "destructive"
    });
  };

  const sidebarNavItems = [
    { icon: Gauge, label: 'Dashboard', active: true, count: null },
    { icon: Bell, label: 'Pending Approvals', active: false, count: 3 },
    { icon: Building2, label: 'Municipalities', active: false, count: null },
    { icon: Building, label: 'Barangays', active: false, count: null },
    { icon: Users, label: 'User Management', active: false, count: null },
    { icon: Settings, label: 'System Settings', active: false, count: null },
  ];

  return (
    <div className="w-full bg-gray-50 min-h-screen flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 text-white fixed h-full">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="text-white h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Baranex</h1>
              <p className="text-sm text-slate-400">System</p>
            </div>
          </div>
        </div>
        
        <nav className="mt-6 px-4">
          <ul className="space-y-2">
            {sidebarNavItems.map((item, index) => (
              <li key={index}>
                <button className={`flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left transition-colors ${
                  item.active 
                    ? 'bg-primary text-white' 
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}>
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {item.count && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 ml-auto">
                      {item.count}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
                <User className="text-sm" />
              </div>
              <span className="text-sm">Super Admin</span>
            </div>
            <Button
              onClick={handleSignOut}
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome, Super Admin!</h1>
          <p className="text-gray-600">Wednesday, July 9, 2025</p>
        </div>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="text-blue-600 h-6 w-6" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Municipalities</h3>
            <p className="text-3xl font-bold text-gray-800">12</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Building className="text-green-600 h-6 w-6" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Barangays</h3>
            <p className="text-3xl font-bold text-gray-800">342</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="text-orange-600 h-6 w-6" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">System-Wide Residents</h3>
            <p className="text-3xl font-bold text-gray-800">145,987</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="text-purple-600 h-6 w-6" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Documents Issued</h3>
            <p className="text-3xl font-bold text-gray-800">289,450</p>
          </div>
        </div>
        
        {/* Management Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Onboarding & Registration Management</h2>
          </div>
          
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              <button 
                className={`py-4 px-2 font-medium ${
                  activeTab === 'pending'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('pending')}
              >
                Pending Approvals
              </button>
              <button 
                className={`py-4 px-2 font-medium ${
                  activeTab === 'registered'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('registered')}
              >
                Registered Entities
              </button>
            </div>
          </div>
          
          {/* Table */}
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LGU Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Person</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Request</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingApprovals.map((approval) => (
                    <tr key={approval.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {approval.lguName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Badge 
                          variant="outline" 
                          className={
                            approval.type === 'Barangay' 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : 'bg-blue-100 text-blue-800 border-blue-200'
                          }
                        >
                          {approval.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {approval.contactPerson}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {approval.contactEmail}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {approval.dateOfRequest}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(approval)}
                            className="bg-primary hover:bg-primary/90 text-white"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(approval)}
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      {/* Approval Modal */}
      {isModalOpen && selectedApproval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-[600px] max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                Approve New {selectedApproval.type} Registration
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100"
              >
                <X className="w-4 h-4 text-gray-500" />
              </Button>
            </div>
            
            <div className="p-6 space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {selectedApproval.type} Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Parent Municipality
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                      <option>Tagum City</option>
                      <option>Davao City</option>
                      <option>City of Panabo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Official {selectedApproval.type} Name
                    </label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      defaultValue={selectedApproval.lguName}
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Create Initial {selectedApproval.type} Admin Account
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name of Admin
                    </label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="e.g., Juan de la Cruz"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username
                    </label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="e.g., brgyadmin_mankilam"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Email
                    </label>
                    <input 
                      type="email" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="e.g., admin@mankilam.gov.ph"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-6 border-t border-gray-200">
              <Button
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  toast({
                    title: "Application Approved",
                    description: `${selectedApproval.lguName} has been successfully approved and registered.`,
                  });
                  setIsModalOpen(false);
                }}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                Finalize {selectedApproval.type} Approval
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EchelonPage;