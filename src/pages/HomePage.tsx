
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MessageSquare, FileText, Users, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const HomePage = () => {
  const { userProfile } = useAuth();
  const [barangayName, setBarangayName] = useState<string>('your barangay');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    // Set current date
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    setCurrentDate(now.toLocaleDateString('en-US', options));

    // Fetch barangay name
    const fetchBarangayName = async () => {
      if (userProfile?.brgyid) {
        try {
          const { data, error } = await supabase
            .from('barangays')
            .select('barangayname')
            .eq('id', userProfile.brgyid)
            .single();
          
          if (data && !error) {
            setBarangayName(data.barangayname);
          }
        } catch (err) {
          console.error('Error fetching barangay name:', err);
        }
      }
    };

    fetchBarangayName();
  }, [userProfile]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header Card */}
      <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 mb-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {userProfile?.firstname}!
            </h1>
            <p className="text-purple-100">
              Here's what's happening in {barangayName} today
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-white/20 rounded-lg px-3 py-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">{currentDate}</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Events */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold text-purple-700 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Upcoming Events
            </CardTitle>
            <button className="text-gray-400 hover:text-gray-600">•••</button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-l-4 border-green-500 pl-4 py-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">Barangay Clean-up Drive</h4>
                  <p className="text-sm text-gray-600">May 20, 2023 • 8:00 AM</p>
                  <p className="text-sm text-gray-500">Main Street Park</p>
                </div>
                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">Required</span>
              </div>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">Health and Wellness Seminar</h4>
                  <p className="text-sm text-gray-600">May 25, 2023 • 1:00 PM</p>
                  <p className="text-sm text-gray-500">Barangay Hall</p>
                </div>
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">Optional</span>
              </div>
            </div>

            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">Community Fiesta Celebration</h4>
                  <p className="text-sm text-gray-600">June 12, 2023 • All Day</p>
                  <p className="text-sm text-gray-500">Barangay Plaza</p>
                </div>
                <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">Festival</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Latest Announcements */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold text-purple-700 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Latest Announcements
            </CardTitle>
            <button className="text-gray-400 hover:text-gray-600">•••</button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border border-red-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800">Water Interruption Notice</h4>
                  <p className="text-sm text-gray-600 mt-1">Due to maintenance works, water supply will be interrupted on May 18, 2023 from 10 AM to 4 PM.</p>
                  <p className="text-xs text-gray-500 mt-2">Posted by Admin • May 15, 2023</p>
                </div>
              </div>
            </div>

            <div className="border border-blue-200 rounded-lg p-3">
              <div>
                <h4 className="font-medium text-blue-800">New Garbage Collection Schedule</h4>
                <p className="text-sm text-gray-600 mt-1">Starting June 1, garbage collection will be on Mondays, Wednesdays, and Fridays only.</p>
                <p className="text-xs text-gray-500 mt-2">Posted by Admin • May 12, 2023</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Your Certificates & Documents */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold text-purple-700 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Your Certificates & Documents
            </CardTitle>
            <button className="text-gray-400 hover:text-gray-600">•••</button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="font-medium">Barangay Clearance</h4>
                  <p className="text-xs text-gray-500">Requested May 14, 2023</p>
                </div>
              </div>
              <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded">Pending</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="font-medium">Certificate of Residency</h4>
                  <p className="text-xs text-gray-500">Requested May 10, 2023</p>
                </div>
              </div>
              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">Ready</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="font-medium">Indigency Certificate</h4>
                  <p className="text-xs text-gray-500">Requested Apr 25, 2023</p>
                </div>
              </div>
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">Approved</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <XCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="font-medium">Business Permit</h4>
                  <p className="text-xs text-gray-500">Requested May 1, 2023</p>
                </div>
              </div>
              <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded">Declined</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barangay Officials Section */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold text-purple-700 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Your Barangay Officials
          </CardTitle>
          <button className="text-gray-400 hover:text-gray-600">•••</button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-300 rounded-lg mx-auto mb-3"></div>
              <h4 className="font-medium text-sm">Roberto Santos</h4>
              <p className="text-xs text-purple-600">Barangay Captain</p>
              <p className="text-xs text-gray-500">Term: 2022-2025</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-300 rounded-lg mx-auto mb-3"></div>
              <h4 className="font-medium text-sm">Maria Reyes</h4>
              <p className="text-xs text-purple-600">Barangay Secretary</p>
              <p className="text-xs text-gray-500">Term: 2022-2025</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-300 rounded-lg mx-auto mb-3"></div>
              <h4 className="font-medium text-sm">Antonio Cruz</h4>
              <p className="text-xs text-purple-600">Barangay Treasurer</p>
              <p className="text-xs text-gray-500">Term: 2022-2025</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-300 rounded-lg mx-auto mb-3"></div>
              <h4 className="font-medium text-sm">Carlos Bautista</h4>
              <p className="text-xs text-purple-600">Kagawad - Education</p>
              <p className="text-xs text-gray-500">Term: 2022-2025</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-300 rounded-lg mx-auto mb-3"></div>
              <h4 className="font-medium text-sm">Teresa Mendoza</h4>
              <p className="text-xs text-purple-600">Kagawad - Health</p>
              <p className="text-xs text-gray-500">Term: 2022-2025</p>
            </div>
          </div>
          
          <div className="text-center mt-6">
            <button className="text-purple-600 hover:text-purple-800 text-sm font-medium">
              View all barangay officials →
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HomePage;
