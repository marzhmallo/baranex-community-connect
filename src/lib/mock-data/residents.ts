
import { Resident } from '../types';

// Mock Residents Data
export const residents: Resident[] = [
  {
    id: '1',
    first_name: 'Juan',
    last_name: 'Dela Cruz',
    gender: 'Male',
    birthdate: '1985-06-15',
    address: '123 Rizal Street, Barangay San Jose',
    mobile_number: '09123456789',
    email: 'juan.delacruz@example.com',
    occupation: 'Teacher',
    educationLevel: 'College Graduate',
    familySize: 4,
    status: 'Permanent',
    // Legacy camelCase for backward compatibility
    firstName: 'Juan',
    lastName: 'Dela Cruz',
    birthDate: '1985-06-15',
    contactNumber: '09123456789',
    emergencyContact: {
      name: 'Maria Dela Cruz',
      relationship: 'Wife',
      contactNumber: '09187654321'
    }
  },
  {
    id: '2',
    first_name: 'Maria',
    last_name: 'Santos',
    gender: 'Female',
    birthdate: '1990-03-22',
    address: '456 Bonifacio Avenue, Barangay San Jose',
    mobile_number: '09234567890',
    email: 'maria.santos@example.com',
    occupation: 'Nurse',
    educationLevel: 'College Graduate',
    familySize: 2,
    status: 'Permanent',
    // Legacy camelCase for backward compatibility
    firstName: 'Maria',
    lastName: 'Santos',
    birthDate: '1990-03-22',
    contactNumber: '09234567890',
    emergencyContact: {
      name: 'Pedro Santos',
      relationship: 'Father',
      contactNumber: '09298765432'
    }
  },
  {
    id: '3',
    first_name: 'Pedro',
    last_name: 'Reyes',
    gender: 'Male',
    birthdate: '1975-11-30',
    address: '789 Mabini Street, Barangay San Jose',
    mobile_number: '09345678901',
    occupation: 'Carpenter',
    educationLevel: 'High School Graduate',
    familySize: 5,
    status: 'Permanent',
    // Legacy camelCase for backward compatibility
    firstName: 'Pedro',
    lastName: 'Reyes',
    birthDate: '1975-11-30',
    contactNumber: '09345678901',
    emergencyContact: {
      name: 'Ana Reyes',
      relationship: 'Wife',
      contactNumber: '09376543210'
    }
  },
  {
    id: '4',
    first_name: 'Rosa',
    last_name: 'Diaz',
    gender: 'Female',
    birthdate: '1988-07-12',
    address: '101 Aguinaldo Street, Barangay San Jose',
    mobile_number: '09456789012',
    email: 'rosa.diaz@example.com',
    occupation: 'Accountant',
    educationLevel: 'College Graduate',
    familySize: 3,
    status: 'Permanent',
    // Legacy camelCase for backward compatibility
    firstName: 'Rosa',
    lastName: 'Diaz',
    birthDate: '1988-07-12',
    contactNumber: '09456789012',
    emergencyContact: {
      name: 'Carlos Diaz',
      relationship: 'Husband',
      contactNumber: '09465432109'
    }
  },
  {
    id: '5',
    first_name: 'Antonio',
    last_name: 'Gonzales',
    gender: 'Male',
    birthdate: '1965-04-28',
    address: '202 Luna Street, Barangay San Jose',
    mobile_number: '09567890123',
    occupation: 'Farmer',
    educationLevel: 'Elementary Graduate',
    familySize: 6,
    status: 'Permanent',
    // Legacy camelCase for backward compatibility
    firstName: 'Antonio',
    lastName: 'Gonzales',
    birthDate: '1965-04-28',
    contactNumber: '09567890123',
    emergencyContact: {
      name: 'Elena Gonzales',
      relationship: 'Wife',
      contactNumber: '09554321098'
    }
  }
];

<div id="webcrumbs"> 
        	
	<div className="w-full min-h-screen bg-gray-50 p-6">
	  <div className="max-w-7xl mx-auto">
	    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
	      
	      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5">
	        <div className="flex items-center justify-between">
	          <div className="flex items-center space-x-3">
	            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
	              <span className="material-symbols-outlined text-white text-2xl">event_note</span>
	            </div>
	            <div>
	              <h1 className="text-2xl font-bold text-white">Activity Logs</h1>
	              <p className="text-primary-100 text-sm">Track all user activities and system events</p>
	            </div>
	          </div>
	          <div className="flex items-center space-x-3">
	            <div className="px-3 py-1 bg-white bg-opacity-20 rounded-full">
	              <span className="text-white text-sm font-medium">1,247 Total Logs</span>
	            </div>
	            <button className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all duration-200">
	              <span className="material-symbols-outlined text-white">refresh</span>
	            </button>
	          </div>
	        </div>
	      </div>
	
	      <div className="p-6 border-b border-gray-200">
	        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
	          <div className="relative">
	            <label className="block text-sm font-medium text-gray-700 mb-2">Search Activities</label>
	            <div className="relative">
	              <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">search</span>
	              <input 
	                type="text" 
	                placeholder="Search by action, user, or details..."
	                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
	              />
	            </div>
	          </div>
	          
	          <div className="relative">
	            <label className="block text-sm font-medium text-gray-700 mb-2">Sort by User</label>
	            <details className="relative">
	              <summary className="w-full px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors duration-200 flex items-center justify-between">
	                <span  className="text-gray-700">All Users</span>
	                <span className="material-symbols-outlined transform transition-transform duration-200">expand_more</span>
	              </summary>
	              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 py-1">
	                <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200">All Users</div>
	                <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200">Admin Users</div>
	                <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200">Regular Users</div>
	                <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200">System</div>
	              </div>
	            </details>
	          </div>
	
	          <div className="relative">
	            <label className="block text-sm font-medium text-gray-700 mb-2">Sort by Action</label>
	            <details className="relative">
	              <summary className="w-full px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors duration-200 flex items-center justify-between">
	                <span className="text-gray-700">All Actions</span>
	                <span className="material-symbols-outlined transform transition-transform duration-200">expand_more</span>
	              </summary>
	              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 py-1">
	                <div  className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200">All Actions</div>
	                <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200">Login</div>
	                <div  className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200">Create</div>
	                <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200">Update</div>
	                <div  className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200">Delete</div>
	                <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200">Export</div>
	              </div>
	            </details>
	          </div>
	
	          <div className="relative">
	            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
	            <input 
	              type="date" 
	              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
	            />
	          </div>
	        </div>
	      </div>
	
	      <div className="overflow-x-auto">
	        <table className="w-full">
	          <thead className="bg-gray-50">
	            <tr>
	              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
	              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
	              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
	              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
	              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
	              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
	              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
	              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
	            </tr>
	          </thead>
	          <tbody className="bg-white divide-y divide-gray-200">
	            
	            <tr  className="hover:bg-gray-50 transition-colors duration-200">
	              <td className="px-6 py-4 whitespace-nowrap">
	                <div className="text-sm text-gray-900">2024-01-15 09:23:45</div>
	                <div className="text-xs text-gray-500">5 minutes ago</div>
	              </td>
	              <td className="px-6 py-4 whitespace-nowrap">
	                <div className="flex items-center">
	                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
	                    <span className="text-white text-xs font-medium">JD</span>
	                  </div>
	                  <div className="ml-3">
	                    <div className="text-sm font-medium text-gray-900">John Doe</div>
	                    <div className="text-sm text-gray-500">Admin</div>
	                  </div>
	                </div>
	              </td>
	              <td className="px-6 py-4 whitespace-nowrap">
	                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
	                  <span className="material-symbols-outlined text-xs mr-1">login</span>
	                  Login
	                </span>
	              </td>
	              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Admin Dashboard</td>
	              <td className="px-6 py-4">
	                <div className="text-sm text-gray-900">Successful authentication</div>
	                <div className="text-xs text-gray-500">Browser: Chrome 120.0.0.0</div>
	                <div  className="text-xs text-gray-500">OS: Windows 10</div>
	              </td>
	              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">192.168.1.100</td>
	              <td className="px-6 py-4 whitespace-nowrap">
	                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
	                  Success
	                </span>
	              </td>
	              <td className="px-6 py-4 whitespace-nowrap">
	                <details className="relative">
	                  <summary  className="p-2 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-200">
	                    <span className="material-symbols-outlined">more_vert</span>
	                  </summary>
	                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 py-1 w-32">
	                    <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200 text-sm">View Details</div>
	                    <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200 text-sm">Export</div>
	                  </div>
	                </details>
	              </td>
	            </tr>
	
	            <tr className="hover:bg-gray-50 transition-colors duration-200">
	              <td className="px-6 py-4 whitespace-nowrap">
	                <div className="text-sm text-gray-900">2024-01-15 09:18:32</div>
	                <div className="text-xs text-gray-500">10 minutes ago</div>
	              </td>
	              <td className="px-6 py-4 whitespace-nowrap">
	                <div className="flex items-center">
	                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
	                    <span className="text-white text-xs font-medium">MS</span>
	                  </div>
	                  <div className="ml-3">
	                    <div className="text-sm font-medium text-gray-900">Maria Santos</div>
	                    <div className="text-sm text-gray-500">Staff</div>
	                  </div>
	                </div>
	              </td>
	              <td className="px-6 py-4 whitespace-nowrap">
	                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
	                  <span  className="material-symbols-outlined text-xs mr-1">add</span>
	                  Create
	                </span>
	              </td>
	              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Resident Record</td>
	              <td  className="px-6 py-4">
	                <div className="text-sm text-gray-900">Created new resident profile</div>
	                <div className="text-xs text-gray-500">Name: Juan Cruz</div>
	                <div className="text-xs text-gray-500">ID: RES-2024-001</div>
	              </td>
	              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">192.168.1.105</td>
	              <td className="px-6 py-4 whitespace-nowrap">
	                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
	                  Success
	                </span>
	              </td>
	              <td className="px-6 py-4 whitespace-nowrap">
	                <details className="relative">
	                  <summary className="p-2 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-200">
	                    <span className="material-symbols-outlined">more_vert</span>
	                  </summary>
	                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 py-1 w-32">
	                    <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200 text-sm">View Details</div>
	                    <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200 text-sm">Export</div>
	                  </div>
	                </details>
	              </td>
	            </tr>
	
	            <tr className="hover:bg-gray-50 transition-colors duration-200">
	              <td className="px-6 py-4 whitespace-nowrap">
	                <div className="text-sm text-gray-900">2024-01-15 09:15:21</div>
	                <div className="text-xs text-gray-500">13 minutes ago</div>
	              </td>
	              <td className="px-6 py-4 whitespace-nowrap">
	                <div className="flex items-center">
	                  <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
	                    <span className="material-symbols-outlined text-white text-xs">computer</span>
	                  </div>
	                  <div className="ml-3">
	                    <div className="text-sm font-medium text-gray-900">System</div>
	                    <div className="text-sm text-gray-500">Automated</div>
	                  </div>
	                </div>
	              </td>
	              <td className="px-6 py-4 whitespace-nowrap">
	                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
	                  <span className="material-symbols-outlined text-xs mr-1">backup</span>
	                  Backup
	                </span>
	              </td>
	              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Database</td>
	              <td className="px-6 py-4">
	                <div className="text-sm text-gray-900">Daily database backup completed</div>
	                <div className="text-xs text-gray-500">Size: 2.5 GB</div>
	                <div className="text-xs text-gray-500">Location: /backups/daily_20240115.sql</div>
	              </td>
	              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">127.0.0.1</td>
	              <td className="px-6 py-4 whitespace-nowrap">
	                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
	                  Success
	                </span>
	              </td>
	              <td className="px-6 py-4 whitespace-nowrap">
	                <details className="relative">
	                  <summary className="p-2 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-200">
	                    <span className="material-symbols-outlined">more_vert</span>
	                  </summary>
	                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 py-1 w-32">
	                    <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200 text-sm">View Details</div>
	                    <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200 text-sm">Export</div>
	                  </div>
	                </details>
	              </td>
	            </tr>
	
	            <tr className="hover:bg-gray-50 transition-colors duration-200">
	              <td className="px-6 py-4 whitespace-nowrap">
	                <div className="text-sm text-gray-900">2024-01-15 09:12:18</div>
	                <div className="text-xs text-gray-500">16 minutes ago</div>
	              </td>
	              <td className="px-6 py-4 whitespace-nowrap">
	                <div className="flex items-center">
	                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
	                    <span className="text-white text-xs font-medium">RP</span>
	                  </div>
	                  <div className="ml-3">
	                    <div className="text-sm font-medium text-gray-900">Robert Perez</div>
	                    <div className="text-sm text-gray-500">Staff</div>
	                  </div>
	                </div>
	              </td>
	              <td className="px-6 py-4 whitespace-nowrap">
	                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
	                  <span className="material-symbols-outlined text-xs mr-1">edit</span>
	                  Update
	                </span>
	              </td>
	              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Barangay Clearance</td>
	              <td className="px-6 py-4">
	                <div className="text-sm text-gray-900">Updated clearance status</div>
	                <div className="text-xs text-gray-500">Document ID: BC-2024-0089</div>
	                <div className="text-xs text-gray-500">Status: Pending → Approved</div>
	              </td>
	              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">192.168.1.108</td>
	              <td className="px-6 py-4 whitespace-nowrap">
	                <span  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
	                  Success
	                </span>
	              </td>
	              <td className="px-6 py-4 whitespace-nowrap">
	                <details className="relative">
	                  <summary className="p-2 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-200">
	                    <span className="material-symbols-outlined">more_vert</span>
	                  </summary>
	                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 py-1 w-32">
	                    <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200 text-sm">View Details</div>
	                    <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200 text-sm">Export</div>
	                  </div>
	                </details>
	              </td>
	            </tr>
	
	            <tr className="hover:bg-gray-50 transition-colors duration-200">
	              <td className="px-6 py-4 whitespace-nowrap">
	                <div className="text-sm text-gray-900">2024-01-15 09:08:55</div>
	                <div className="text-xs text-gray-500">19 minutes ago</div>
	              </td>
	              <td className="px-6 py-4 whitespace-nowrap">
	                <div className="flex items-center">
	                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
	                    <span className="text-white text-xs font-medium">AL</span>
	                  </div>
	                  <div className="ml-3">
	                    <div className="text-sm font-medium text-gray-900">Anna Lopez</div>
	                    <div className="text-sm text-gray-500">Admin</div>
	                  </div>
	                </div>
	              </td>
	              <td className="px-6 py-4 whitespace-nowrap">
	                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
	                  <span className="material-symbols-outlined text-xs mr-1">delete</span>
	                  Delete
	                </span>
	              </td>
	              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">User Account</td>
	              <td className="px-6 py-4">
	                <div className="text-sm text-gray-900">Deleted inactive user account</div>
	                <div className="text-xs text-gray-500">User: test_user@barangay.gov</div>
	                <div className="text-xs text-gray-500">Reason: Account inactive for 90 days</div>
	              </td>
	              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">192.168.1.102</td>
	              <td className="px-6 py-4 whitespace-nowrap">
	                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
	                  Success
	                </span>
	              </td>
	              <td className="px-6 py-4 whitespace-nowrap">
	                <details className="relative">
	                  <summary className="p-2 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-200">
	                    <span className="material-symbols-outlined">more_vert</span>
	                  </summary>
	                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 py-1 w-32">
	                    <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200 text-sm">View Details</div>
	                    <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200 text-sm">Export</div>
	                  </div>
	                </details>
	              </td>
	            </tr>
	
	            <tr className="hover:bg-gray-50 transition-colors duration-200">
	              <td className="px-6 py-4 whitespace-nowrap">
	                <div className="text-sm text-gray-900">2024-01-15 09:05:12</div>
	                <div className="text-xs text-gray-500">23 minutes ago</div>
	              </td>
	              <td className="px-6 py-4 whitespace-nowrap">
	                <div className="flex items-center">
	                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
	                    <span className="text-white text-xs font-medium">CT</span>
	                  </div>
	                  <div className="ml-3">
	                    <div className="text-sm font-medium text-gray-900">Carlos Torres</div>
	                    <div className="text-sm text-gray-500">Staff</div>
	                  </div>
	                </div>
	              </td>
	              <td className="px-6 py-4 whitespace-nowrap">
	                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
	                  <span className="material-symbols-outlined text-xs mr-1">download</span>
	                  Export
	                </span>
	              </td>
	              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Resident Report</td>
	              <td className="px-6 py-4">
	                <div  className="text-sm text-gray-900">Generated resident demographics report</div>
	                <div className="text-xs text-gray-500">Format: PDF</div>
	                <div className="text-xs text-gray-500">Records: 1,245 residents</div>
	              </td>
	              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">192.168.1.112</td>
	              <td className="px-6 py-4 whitespace-nowrap">
	                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
	                  Success
	                </span>
	              </td>
	              <td className="px-6 py-4 whitespace-nowrap">
	                <details className="relative">
	                  <summary  className="p-2 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-200">
	                    <span className="material-symbols-outlined">more_vert</span>
	                  </summary>
	                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 py-1 w-32">
	                    <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200 text-sm">View Details</div>
	                    <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200 text-sm">Export</div>
	                  </div>
	                </details>
	              </td>
	            </tr>
	
	          </tbody>
	        </table>
	      </div>
	
	      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
	        <div  className="flex items-center justify-between">
	          <div className="flex items-center space-x-2">
	            <span className="text-sm text-gray-700">Showing</span>
	            <details className="relative">
	              <summary className="px-3 py-1 border border-gray-300 rounded cursor-pointer hover:border-gray-400 transition-colors duration-200">
	                <span  className="text-sm">10</span>
	              </summary>
	              <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 py-1">
	                <div className="px-3 py-1 hover:bg-gray-50 cursor-pointer transition-colors duration-200 text-sm">5</div>
	                <div className="px-3 py-1 hover:bg-gray-50 cursor-pointer transition-colors duration-200 text-sm">10</div>
	                <div className="px-3 py-1 hover:bg-gray-50 cursor-pointer transition-colors duration-200 text-sm">25</div>
	                <div className="px-3 py-1 hover:bg-gray-50 cursor-pointer transition-colors duration-200 text-sm">50</div>
	              </div>
	            </details>
	            <span  className="text-sm text-gray-700">of 1,247 results</span>
	          </div>
	          
	          <div className="flex items-center space-x-2">
	            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50">
	              <span className="material-symbols-outlined text-sm">chevron_left</span>
	            </button>
	            <button className="px-3 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors duration-200">1</button>
	            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-200">2</button>
	            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-200">3</button>
	            <span className="px-2 text-gray-500">...</span>
	            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-200">125</button>
	            <button  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-200">
	              <span className="material-symbols-outlined text-sm">chevron_right</span>
	            </button>
	          </div>
	        </div>
	      </div>
	
	      <div className="px-6 py-4 bg-white border-t border-gray-200">
	        <div className="flex items-center justify-between">
	          <div className="flex items-center space-x-4">
	            <button className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200">
	              <span className="material-symbols-outlined text-sm">download</span>
	              <span>Export Logs</span>
	            </button>
	            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
	              <span className="material-symbols-outlined text-sm">filter_alt</span>
	              <span>Advanced Filter</span>
	            </button>
	          </div>
	          <div className="flex items-center space-x-2 text-sm text-gray-600">
	            <span className="material-symbols-outlined text-sm">schedule</span>
	            <span>Last updated: 2 minutes ago</span>
	          </div>
	        </div>
	      </div>
	      
	      {/* Next: "Add real-time log streaming feature" */}
	      
	      {/* Next: "Add log retention policy settings" */}
	      {/* Next: "Add user activity analytics dashboard" */}
	    <div >
	  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
	    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
	      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 flex items-center justify-between">
	        <div className="flex items-center space-x-3">
	          <div className="p-2 bg-white bg-opacity-20 rounded-lg">
	            <span className="material-symbols-outlined text-white text-xl">search</span>
	          </div>
	          <h2 className="text-xl font-bold text-white">Audit Log Details</h2>
	        </div>
	        <button className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all duration-200 text-white">
	          <span className="material-symbols-outlined">close</span>
	        </button>
	      </div>
	      
	      <div className="p-6 overflow-y-auto">
	        <div className="border-b border-gray-200 pb-4 mb-4">
	          <div className="flex items-center space-x-4 mb-4">
	            <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
	              <span className="text-white text-sm font-medium">JD</span>
	            </div>
	            <div>
	              <h3 className="text-lg font-semibold">Login Activity</h3>
	              <p className="text-gray-500">Performed by John Doe (Admin) • 5 minutes ago</p>
	            </div>
	            <span className="ml-auto inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
	              Success
	            </span>
	          </div>
	          
	          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
	            <div>
	              <h4 className="text-sm font-medium text-gray-500 uppercase mb-2">Event Information</h4>
	              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
	                <div className="flex">
	                  <span className="text-gray-500 w-1/3">Timestamp:</span>
	                  <span className="font-medium">2024-01-15 09:23:45</span>
	                </div>
	                <div className="flex">
	                  <span className="text-gray-500 w-1/3">Event ID:</span>
	                  <span className="font-medium">EVT-20240115-0001</span>
	                </div>
	                <div className="flex">
	                  <span className="text-gray-500 w-1/3">IP Address:</span>
	                  <span className="font-medium">192.168.1.100</span>
	                </div>
	                <div className="flex">
	                  <span className="text-gray-500 w-1/3">Location:</span>
	                  <span className="font-medium">Manila, Philippines</span>
	                </div>
	              </div>
	            </div>
	            
	            <div>
	              <h4 className="text-sm font-medium text-gray-500 uppercase mb-2">Device Information</h4>
	              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
	                <div className="flex">
	                  <span className="text-gray-500 w-1/3">Browser:</span>
	                  <span className="font-medium">Chrome 120.0.0.0</span>
	                </div>
	                <div className="flex">
	                  <span className="text-gray-500 w-1/3">OS:</span>
	                  <span className="font-medium">Windows 10</span>
	                </div>
	                <div className="flex">
	                  <span className="text-gray-500 w-1/3">Device:</span>
	                  <span className="font-medium">Desktop</span>
	                </div>
	                <div className="flex">
	                  <span className="text-gray-500 w-1/3">Screen:</span>
	                  <span className="font-medium">1920×1080</span>
	                </div>
	              </div>
	            </div>
	          </div>
	        </div>
	        
	        <div className="mb-6">
	          <h4 className="text-sm font-medium text-gray-500 uppercase mb-2">Detailed Event Data</h4>
	          <div className="bg-gray-50 rounded-lg p-4">
	            <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800">
	{`{
	  "event_type": "authentication",
	  "status": "success",
	  "user": {
	    "id": "USR-001",
	    "username": "john.doe",
	    "role": "admin",
	    "last_login": "2024-01-14T18:45:22Z"
	  },
	  "resource": {
	    "type": "dashboard",
	    "name": "Admin Dashboard",
	    "path": "/admin/dashboard"
	  },
	  "auth_method": "password",
	  "session_id": "SES-20240115-7842",
	  "duration": "28ms"
	}`}
	            </pre>
	          </div>
	        </div>
	        
	        <div className="mb-6">
	          <h4 className="text-sm font-medium text-gray-500 uppercase mb-2">Related Activities</h4>
	          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
	            <table className="w-full">
	              <thead className="bg-gray-50">
	                <tr>
	                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
	                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
	                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
	                </tr>
	              </thead>
	              <tbody className="divide-y divide-gray-200">
	                <tr className="hover:bg-gray-50">
	                  <td className="px-4 py-3 text-sm">2024-01-15 09:23:45</td>
	                  <td className="px-4 py-3 text-sm">Login to Admin Dashboard</td>
	                  <td className="px-4 py-3">
	                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Success</span>
	                  </td>
	                </tr>
	                <tr className="hover:bg-gray-50">
	                  <td className="px-4 py-3 text-sm">2024-01-14 17:12:08</td>
	                  <td className="px-4 py-3 text-sm">Login to Admin Dashboard</td>
	                  <td className="px-4 py-3">
	                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Success</span>
	                  </td>
	                </tr>
	                <tr className="hover:bg-gray-50">
	                  <td className="px-4 py-3 text-sm">2024-01-13 10:45:23</td>
	                  <td className="px-4 py-3 text-sm">Login to Admin Dashboard</td>
	                  <td className="px-4 py-3">
	                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Success</span>
	                  </td>
	                </tr>
	                <tr className="hover:bg-gray-50">
	                  <td className="px-4 py-3 text-sm">2024-01-12 08:32:17</td>
	                  <td className="px-4 py-3 text-sm">Login to Admin Dashboard</td>
	                  <td className="px-4 py-3">
	                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Failed</span>
	                  </td>
	                </tr>
	              </tbody>
	            </table>
	          </div>
	        </div>
	        
	        <div className="mb-4">
	          <h4 className="text-sm font-medium text-gray-500 uppercase mb-2">Audit Trail Map</h4>
	          <div className="bg-gray-100 rounded-lg p-4 h-[200px] flex items-center justify-center">
	            <div className="text-center">
	              <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">map</span>
	              <p className="text-gray-500">IP Location: Manila, Philippines (14.5995° N, 120.9842° E)</p>
	            </div>
	            {/* Next: "Add interactive map showing user location" */}
	          </div>
	        </div>
	      <div className="mb-6">
	  <h4 className="text-sm font-medium text-gray-500 uppercase mb-2">Activity Timeline</h4>
	  <div className="bg-white border border-gray-200 rounded-lg p-4">
	    <div className="relative">
	      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
	      
	      <div className="relative pl-12 pb-8">
	        <div className="absolute left-0 w-12 flex justify-center">
	          <div className="w-4 h-4 rounded-full bg-green-500 border-4 border-white shadow"></div>
	        </div>
	        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
	          <div className="flex items-center justify-between mb-1">
	            <span className="text-sm font-semibold">Login to Admin Dashboard</span>
	            <span className="text-xs text-gray-500">2024-01-15 09:23:45</span>
	          </div>
	          <p className="text-sm text-gray-600">Successful authentication via password</p>
	          <div className="flex items-center mt-2">
	            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
	              Success
	            </span>
	          </div>
	        </div>
	      </div>
	      
	      <div className="relative pl-12 pb-8">
	        <div className="absolute left-0 w-12 flex justify-center">
	          <div className="w-4 h-4 rounded-full bg-gray-400 border-4 border-white shadow"></div>
	        </div>
	        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
	          <div className="flex items-center justify-between mb-1">
	            <span className="text-sm font-semibold">Session Expired</span>
	            <span className="text-xs text-gray-500">2024-01-14 18:45:22</span>
	          </div>
	          <p className="text-sm text-gray-600">Session timeout after 2 hours of inactivity</p>
	          <div className="flex items-center mt-2">
	            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
	              Info
	            </span>
	          </div>
	        </div>
	      </div>
	      
	      <div className="relative pl-12 pb-8">
	        <div className="absolute left-0 w-12 flex justify-center">
	          <div className="w-4 h-4 rounded-full bg-green-500 border-4 border-white shadow"></div>
	        </div>
	        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
	          <div className="flex items-center justify-between mb-1">
	            <span className="text-sm font-semibold">Login to Admin Dashboard</span>
	            <span className="text-xs text-gray-500">2024-01-14 17:12:08</span>
	          </div>
	          <p className="text-sm text-gray-600">Successful authentication via password</p>
	          <div className="flex items-center mt-2">
	            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
	              Success
	            </span>
	          </div>
	        </div>
	      </div>
	      
	      <div className="relative pl-12">
	        <div className="absolute left-0 w-12 flex justify-center">
	          <div className="w-4 h-4 rounded-full bg-red-500 border-4 border-white shadow"></div>
	        </div>
	        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
	          <div className="flex items-center justify-between mb-1">
	            <span className="text-sm font-semibold">Login to Admin Dashboard</span>
	            <span className="text-xs text-gray-500">2024-01-12 08:32:17</span>
	          </div>
	          <p className="text-sm text-gray-600">Failed authentication - incorrect password</p>
	          <div className="flex items-center mt-2">
	            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
	              Failed
	            </span>
	          </div>
	        </div>
	      </div>
	      
	    </div>
	  </div>
	</div></div>
	      
	      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
	        <div className="flex items-center space-x-2">
	          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors duration-200">
	            <span className="material-symbols-outlined text-sm">print</span>
	            <span>Print</span>
	          </button>
	          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors duration-200">
	            <span className="material-symbols-outlined text-sm">download</span>
	            <span>Export</span>
	          </button>
	        </div>
	        <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200">
	          Close
	        </button>
	      </div>
	    </div>
	  </div>
	  
	</div></div>
	  </div>
	</div>
	 
        </div>
