
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, Home, Vote, MapPin, PieChart, Users as UsersIcon, GraduationCap, Baby, Briefcase, Map, Heart, TreePine } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface StatisticsData {
  totalResidents: number;
  totalHouseholds: number;
  registeredVoters: number;
  totalPuroks: number;
  genderDistribution: { male: number; female: number };
  ageDistribution: { [key: string]: number };
  purokDistribution: { [key: string]: number };
  voterPercentage: number;
  avgHouseholdSize: number;
}

const StatisticsPage = () => {
  // Fetch statistics data
  const { data: statistics, isLoading, error } = useQuery({
    queryKey: ['barangay-statistics'],
    queryFn: async (): Promise<StatisticsData> => {
      try {
        // Fetch residents
        const { data: residents, error: residentsError } = await supabase
          .from('residents')
          .select('gender, birthdate, purok, is_voter');

        if (residentsError) throw residentsError;

        // Fetch households
        const { data: households, error: householdsError } = await supabase
          .from('households')
          .select('id, purok');

        if (householdsError) throw householdsError;

        // Calculate statistics
        const totalResidents = residents?.length || 0;
        const totalHouseholds = households?.length || 0;
        const registeredVoters = residents?.filter(r => r.is_voter).length || 0;
        
        // Gender distribution
        const maleCount = residents?.filter(r => r.gender === 'Male').length || 0;
        const femaleCount = residents?.filter(r => r.gender === 'Female').length || 0;

        // Age distribution
        const ageGroups = {
          '0-14': 0,
          '15-29': 0,
          '30-59': 0,
          '60+': 0
        };

        residents?.forEach(resident => {
          if (resident.birthdate) {
            const age = new Date().getFullYear() - new Date(resident.birthdate).getFullYear();
            if (age <= 14) ageGroups['0-14']++;
            else if (age <= 29) ageGroups['15-29']++;
            else if (age <= 59) ageGroups['30-59']++;
            else ageGroups['60+']++;
          }
        });

        // Purok distribution
        const purokCounts: { [key: string]: number } = {};
        residents?.forEach(resident => {
          if (resident.purok) {
            purokCounts[resident.purok] = (purokCounts[resident.purok] || 0) + 1;
          }
        });

        const totalPuroks = Object.keys(purokCounts).length;
        const voterPercentage = totalResidents > 0 ? (registeredVoters / totalResidents) * 100 : 0;
        const avgHouseholdSize = totalHouseholds > 0 ? totalResidents / totalHouseholds : 0;

        return {
          totalResidents,
          totalHouseholds,
          registeredVoters,
          totalPuroks,
          genderDistribution: { male: maleCount, female: femaleCount },
          ageDistribution: ageGroups,
          purokDistribution: purokCounts,
          voterPercentage,
          avgHouseholdSize
        };
      } catch (error) {
        console.error('Error fetching statistics:', error);
        throw error;
      }
    }
  });

  if (isLoading) {
    return <StatisticsSkeleton />;
  }

  if (error) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error loading statistics. Please try again later.
        </div>
      </div>
    );
  }

  const malePercentage = statistics!.totalResidents > 0 ? (statistics!.genderDistribution.male / statistics!.totalResidents) * 100 : 0;
  const femalePercentage = statistics!.totalResidents > 0 ? (statistics!.genderDistribution.female / statistics!.totalResidents) * 100 : 0;

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Barangay Statistics Dashboard</h1>
        <p className="text-lg text-gray-600">Comprehensive overview of resident demographics and community data</p>
      </div>

      {/* Key Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-primary-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Population</p>
              <p className="text-3xl font-bold text-gray-800">{statistics!.totalResidents.toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-1">Active residents</p>
            </div>
            <div className="bg-primary-100 p-3 rounded-full">
              <Users className="text-primary-600 h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Households</p>
              <p className="text-3xl font-bold text-gray-800">{statistics!.totalHouseholds.toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-1">Avg {statistics!.avgHouseholdSize.toFixed(1)} per household</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Home className="text-green-600 h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Registered Voters</p>
              <p className="text-3xl font-bold text-gray-800">{statistics!.registeredVoters.toLocaleString()}</p>
              <p className="text-sm text-blue-600 mt-1">{statistics!.voterPercentage.toFixed(1)}% of total population</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <Vote className="text-orange-600 h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Puroks</p>
              <p className="text-3xl font-bold text-gray-800">{statistics!.totalPuroks}</p>
              <p className="text-sm text-gray-500 mt-1">Administrative divisions</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <MapPin className="text-purple-600 h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Gender and Household Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <PieChart className="text-primary-600 mr-2 h-5 w-5" />
            Population by Gender
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded mr-3"></div>
                <span className="text-gray-700">Male</span>
              </div>
              <div className="flex items-center">
                <span className="text-lg font-semibold text-gray-800 mr-3">{statistics!.genderDistribution.male.toLocaleString()}</span>
                <span className="text-sm text-gray-500">{malePercentage.toFixed(1)}%</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{width: `${malePercentage}%`}}></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-pink-500 rounded mr-3"></div>
                <span className="text-gray-700">Female</span>
              </div>
              <div className="flex items-center">
                <span className="text-lg font-semibold text-gray-800 mr-3">{statistics!.genderDistribution.female.toLocaleString()}</span>
                <span className="text-sm text-gray-500">{femalePercentage.toFixed(1)}%</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-pink-500 h-2 rounded-full" style={{width: `${femalePercentage}%`}}></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <UsersIcon className="text-green-600 mr-2 h-5 w-5" />
            Household Statistics
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-700">Average Household Size</span>
              <span className="text-lg font-semibold text-gray-800">{statistics!.avgHouseholdSize.toFixed(1)} persons</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-700">Total Households</span>
              <span className="text-lg font-semibold text-gray-800">{statistics!.totalHouseholds.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-700">Population Density</span>
              <span className="text-lg font-semibold text-gray-800">{(statistics!.totalResidents / statistics!.totalPuroks).toFixed(0)} per purok</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-700">Voter Registration Rate</span>
              <span className="text-lg font-semibold text-gray-800">{statistics!.voterPercentage.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Age Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Baby className="text-orange-600 mr-2 h-5 w-5" />
            Age Distribution
          </h3>
          <div className="space-y-3">
            {Object.entries(statistics!.ageDistribution).map(([ageGroup, count], index) => {
              const percentage = statistics!.totalResidents > 0 ? (count / statistics!.totalResidents) * 100 : 0;
              const colors = ['orange-400', 'orange-500', 'orange-600', 'orange-700'];
              
              return (
                <div key={ageGroup}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{ageGroup} years</span>
                    <span className="text-sm font-medium text-gray-800">{count.toLocaleString()} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`bg-${colors[index]} h-2 rounded-full`} style={{width: `${percentage}%`}}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Briefcase className="text-purple-600 mr-2 h-5 w-5" />
            Employment Overview
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Working Age (15-59)</span>
              <span className="text-sm font-medium text-gray-800">
                {(statistics!.ageDistribution['15-29'] + statistics!.ageDistribution['30-59']).toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{width: '85%'}}></div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Youth (15-29)</span>
              <span className="text-sm font-medium text-gray-800">{statistics!.ageDistribution['15-29'].toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{width: `${(statistics!.ageDistribution['15-29'] / statistics!.totalResidents) * 100}%`}}></div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Senior Citizens (60+)</span>
              <span className="text-sm font-medium text-gray-800">{statistics!.ageDistribution['60+'].toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{width: `${(statistics!.ageDistribution['60+'] / statistics!.totalResidents) * 100}%`}}></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <GraduationCap className="text-blue-600 mr-2 h-5 w-5" />
            Demographics Summary
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Children (0-14)</span>
              <span className="text-sm font-medium text-gray-800">{statistics!.ageDistribution['0-14'].toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-400 h-2 rounded-full" style={{width: `${(statistics!.ageDistribution['0-14'] / statistics!.totalResidents) * 100}%`}}></div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Adults (30-59)</span>
              <span className="text-sm font-medium text-gray-800">{statistics!.ageDistribution['30-59'].toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{width: `${(statistics!.ageDistribution['30-59'] / statistics!.totalResidents) * 100}%`}}></div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Dependency Ratio</span>
              <span className="text-sm font-medium text-gray-800">
                {((statistics!.ageDistribution['0-14'] + statistics!.ageDistribution['60+']) / (statistics!.ageDistribution['15-29'] + statistics!.ageDistribution['30-59']) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-700 h-2 rounded-full" style={{width: '45%'}}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Purok Distribution */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <Map className="text-indigo-600 mr-2 h-5 w-5" />
          Purok Distribution
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(statistics!.purokDistribution)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([purok, count], index) => {
              const colors = [
                'indigo', 'blue', 'teal', 'green', 'yellow',
                'orange', 'red', 'pink', 'purple', 'cyan',
                'emerald', 'lime', 'amber', 'violet', 'rose'
              ];
              const colorIndex = index % colors.length;
              const color = colors[colorIndex];
              
              return (
                <div key={purok} className={`bg-gradient-to-br from-${color}-50 to-${color}-100 p-4 rounded-lg hover:shadow-md transition-shadow duration-200`}>
                  <h4 className={`font-semibold text-${color}-800`}>{purok}</h4>
                  <p className={`text-2xl font-bold text-${color}-900`}>{count.toLocaleString()}</p>
                  <p className={`text-sm text-${color}-600`}>residents</p>
                </div>
              );
            })}
        </div>
      </div>

      {/* Additional Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Heart className="text-red-600 mr-2 h-5 w-5" />
            Community Health
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-700">Registered Voters</span>
              <span className="text-lg font-semibold text-green-600">{statistics!.registeredVoters.toLocaleString()} ({statistics!.voterPercentage.toFixed(1)}%)</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-700">Male Population</span>
              <span className="text-lg font-semibold text-blue-600">{statistics!.genderDistribution.male.toLocaleString()} ({malePercentage.toFixed(1)}%)</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-700">Female Population</span>
              <span className="text-lg font-semibold text-pink-600">{statistics!.genderDistribution.female.toLocaleString()} ({femalePercentage.toFixed(1)}%)</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-700">Senior Citizens</span>
              <span className="text-lg font-semibold text-orange-600">{statistics!.ageDistribution['60+'].toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <TreePine className="text-green-600 mr-2 h-5 w-5" />
            Community Overview
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-700">Active Puroks</span>
              <span className="text-lg font-semibold text-indigo-600">{statistics!.totalPuroks}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-700">Average per Purok</span>
              <span className="text-lg font-semibold text-blue-600">{(statistics!.totalResidents / statistics!.totalPuroks).toFixed(0)} residents</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-700">Youth Population (15-29)</span>
              <span className="text-lg font-semibold text-green-600">{statistics!.ageDistribution['15-29'].toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-700">Children (0-14)</span>
              <span className="text-lg font-semibold text-purple-600">{statistics!.ageDistribution['0-14'].toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatisticsSkeleton = () => {
  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="mb-8">
        <Skeleton className="h-10 w-96 mb-2" />
        <Skeleton className="h-6 w-80" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-lg p-6">
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-lg p-6">
            <Skeleton className="h-40 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatisticsPage;
