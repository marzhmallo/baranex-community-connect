import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, GraduationCap, Award, Briefcase, User, Users, Edit, Clock, Share, Check, X } from 'lucide-react';
import { Official, OfficialPosition } from '@/lib/types';
import { AddEditPositionDialog } from '@/components/officials/AddEditPositionDialog';
import { Badge } from '@/components/ui/badge';
import { AddOfficialDialog } from '@/components/officials/AddOfficialDialog';
import { OfficialCoverPhotoUpload } from '@/components/officials/OfficialCoverPhotoUpload';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const OfficialDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isPositionDialogOpen, setIsPositionDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<OfficialPosition | null>(null);
  const [isCoverPhotoModalOpen, setIsCoverPhotoModalOpen] = useState(false);
  const [isProfilePhotoModalOpen, setIsProfilePhotoModalOpen] = useState(false);

  // Fetch official details with barangay information
  const { data: official, isLoading: officialLoading, refetch: refetchOfficial } = useQuery({
    queryKey: ['official-details-page', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('officials')
        .select(`
          *,
          barangays (
            barangayname,
            municipality,
            province,
            region
          )
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Official & { barangays?: { barangayname: string; municipality: string; province: string; region: string } };
    },
    enabled: !!id
  });

  // Fetch positions for the official
  const { data: positions, isLoading: positionsLoading, refetch: refetchPositions } = useQuery({
    queryKey: ['official-positions-page', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('official_positions')
        .select('*')
        .eq('official_id', id)
        .order('term_start', { ascending: false });
      if (error) throw error;
      return data as OfficialPosition[];
    },
    enabled: !!id
  });

  // Format date to readable format
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Present';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format date with time for record information
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format achievements into bullet points
  const formatAchievements = (achievements: any) => {
    if (!achievements) return null;
    let achievementItems: string[] = [];

    if (Array.isArray(achievements)) {
      achievementItems = achievements;
    } else if (typeof achievements === 'object') {
      achievementItems = Object.values(achievements).map(item => String(item));
    } else if (typeof achievements === 'string') {
      try {
        const parsed = JSON.parse(achievements);
        if (Array.isArray(parsed)) {
          achievementItems = parsed;
        } else if (typeof parsed === 'object') {
          achievementItems = Object.values(parsed).map(item => String(item));
        }
      } catch {
        achievementItems = [achievements];
      }
    }

    if (achievementItems.length === 0) return null;
    return (
      <div className="space-y-4">
        {achievementItems.map((achievement, i) => (
          <div key={i} className="bg-white rounded-lg p-4 border-l-4 border-yellow-400 hover:shadow-md transition-all duration-300">
            <div className="flex items-center space-x-3 mb-2">
              <Award className="h-5 w-5 text-yellow-500" />
              <h3 className="font-semibold text-gray-800">{achievement}</h3>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Format committees into bullet points
  const formatCommittees = (committees: any) => {
    if (!committees) return null;
    let committeeItems: string[] = [];

    if (Array.isArray(committees)) {
      committeeItems = committees;
    } else if (typeof committees === 'object') {
      committeeItems = Object.values(committees).map(item => String(item));
    } else if (typeof committees === 'string') {
      try {
        const parsed = JSON.parse(committees);
        if (Array.isArray(parsed)) {
          committeeItems = parsed;
        } else if (typeof parsed === 'object') {
          committeeItems = Object.values(parsed).map(item => String(item));
        }
      } catch {
        committeeItems = [committees];
      }
    }

    if (committeeItems.length === 0) return null;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {committeeItems.map((committee, i) => (
          <div key={i} className="bg-white rounded-lg p-4 border-l-4 border-primary hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <h3 className="font-semibold text-gray-800 mb-2">{committee}</h3>
            <p className="text-sm text-gray-600 mb-2">Member</p>
            <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Active</span>
          </div>
        ))}
      </div>
    );
  };

  // Format education into bullet points
  const formatEducation = (educ: any) => {
    if (!educ) return null;
    let educItems: string[] = [];

    if (Array.isArray(educ)) {
      educItems = educ;
    } else if (typeof educ === 'object') {
      educItems = Object.values(educ).map(item => String(item));
    } else if (typeof educ === 'string') {
      try {
        const parsed = JSON.parse(educ);
        if (Array.isArray(parsed)) {
          educItems = parsed;
        } else if (typeof parsed === 'object') {
          educItems = Object.values(parsed).map(item => String(item));
        }
      } catch {
        educItems = [educ];
      }
    }

    if (educItems.length === 0) return null;
    return (
      <div className="space-y-4">
        {educItems.map((education, i) => (
          <div key={i} className="bg-white rounded-lg p-4 hover:shadow-md transition-all duration-300">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{education}</h3>
                <p className="text-sm text-gray-600 mt-1">Educational Achievement</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Filter positions into current and past
  const currentPositions = positions?.filter(position => 
    !position.term_end || new Date(position.term_end) >= new Date()
  ) || [];
  
  const pastPositions = positions?.filter(position => 
    position.term_end && new Date(position.term_end) < new Date()
  ) || [];

  const handleAddPosition = () => {
    setSelectedPosition(null);
    setIsPositionDialogOpen(true);
  };

  const handleEditPosition = (position: OfficialPosition) => {
    setSelectedPosition(position);
    setIsPositionDialogOpen(true);
  };

  const handleEditOfficial = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditDialogOpen(true);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Add share functionality here if needed
  };

  const handleEditSuccess = () => {
    refetchOfficial();
    refetchPositions();
  };

  const handleCoverPhotoUpload = (url: string) => {
    refetchOfficial();
  };

  const handleCoverPhotoClick = (e: React.MouseEvent) => {
    // Prevent opening modal if clicking on the upload button area or action buttons
    const target = e.target as HTMLElement;
    if (target.closest('.cover-upload-area') || target.closest('.header-action-button')) {
      return;
    }
    
    if (official?.coverurl) {
      setIsCoverPhotoModalOpen(true);
    }
  };

  const handleProfilePhotoClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent cover photo modal from opening
    if (official?.photo_url) {
      setIsProfilePhotoModalOpen(true);
    }
  };

  const goBack = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(-1);
  };

  if (officialLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-6 py-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <Skeleton className="h-64 w-full" />
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!official) {
    return (
      <div className="w-full max-w-7xl mx-auto px-6 py-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Official Not Found</h2>
          <p className="mb-4">The official you are looking for could not be found.</p>
          <Button onClick={goBack} variant="outline">Go Back</Button>
        </div>
      </div>
    );
  }

  // Get the current position from positions
  const getCurrentPosition = () => {
    if (currentPositions.length > 0) {
      return currentPositions[0];
    } else if (pastPositions.length > 0) {
      return pastPositions[0];
    } else {
      return null;
    }
  };

  const currentPosition = getCurrentPosition();

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header Section with Hero Background */}
        <div 
          className={`relative h-64 bg-gradient-to-r from-primary-600 to-primary-800 ${official?.coverurl ? 'cursor-pointer' : ''}`}
          style={{
            backgroundImage: official?.coverurl ? `url(${official.coverurl})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
          onClick={handleCoverPhotoClick}
        >
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
          
          {/* Cover Photo Upload Component */}
          {id && (
            <div className="cover-upload-area">
              <OfficialCoverPhotoUpload
                officialId={id}
                currentCoverUrl={official?.coverurl}
                onUploadSuccess={handleCoverPhotoUpload}
              />
            </div>
          )}
          
          <div className="absolute bottom-6 left-6 flex items-end space-x-6">
            <div className="relative">
              {official?.photo_url ? (
                <img 
                  src={official.photo_url} 
                  alt={official.name}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover cursor-pointer hover:opacity-90 transition-opacity duration-200"
                  onClick={handleProfilePhotoClick}
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-muted flex items-center justify-center">
                  <User className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center">
                <Check className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="text-white pb-2">
              <h1 className="text-3xl font-bold mb-1">{official?.name}</h1>
              <p className="text-primary-100 text-lg">{currentPosition?.position || 'Barangay Official'}</p>
              <p className="text-primary-200 text-sm">
                {official.barangays ? 
                  `${official.barangays.barangayname}, ${official.barangays.municipality}, ${official.barangays.province}, ${official.barangays.region}` 
                  : currentPosition?.committee || 'Department'
                }
              </p>
            </div>
          </div>
          <div className="absolute top-6 right-6 flex space-x-2">
            <button 
              onClick={handleEditOfficial}
              className="header-action-button bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-300 backdrop-blur-sm rounded-full p-3 text-white hover:scale-105"
            >
              <Edit className="h-5 w-5" />
            </button>
            <button 
              onClick={handleShareClick}
              className="header-action-button bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-300 backdrop-blur-sm rounded-full p-3 text-white hover:scale-105"
            >
              <Share className="h-5 w-5" />
            </button>
          </div>
          <button 
            onClick={goBack}
            className="header-action-button absolute top-6 left-6 bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-300 backdrop-blur-sm rounded-full p-3 text-white hover:scale-105"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Biography Section */}
              <section className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow duration-300">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <User className="text-primary-600 mr-3 h-6 w-6" />
                  Biography
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {official?.bio || `${official?.name || 'This official'} is a dedicated public servant working for the betterment of the community.`}
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Born and raised in the community, this official has dedicated their career to public service, focusing on sustainable development and community engagement initiatives. Their leadership has been recognized both locally and regionally.
                </p>
              </section>

              {/* Committees Section */}
              {official?.committees && (
                <section className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow duration-300">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                    <Users className="text-primary-600 mr-3 h-6 w-6" />
                    Committees
                  </h2>
                  {formatCommittees(official.committees)}
                </section>
              )}

              {/* Education Section */}
              {official?.educ && (
                <section className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow duration-300">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                    <GraduationCap className="text-primary-600 mr-3 h-6 w-6" />
                    Education
                  </h2>
                  {formatEducation(official.educ)}
                </section>
              )}

              {/* Achievements Section */}
              {official?.achievements && (
                <section className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow duration-300">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                    <Award className="text-primary-600 mr-3 h-6 w-6" />
                    Achievements & Awards
                  </h2>
                  {formatAchievements(official.achievements)}
                </section>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Current Position */}
              <section className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <Briefcase className="text-primary-600 mr-2 h-5 w-5" />
                  Current Position
                </h2>
                <div className="space-y-4">
                  {currentPositions.length > 0 ? (
                    currentPositions.map(position => (
                      <div key={position.id} className="bg-primary-50 rounded-lg p-4 border border-primary-200">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-800">{position.position}</h3>
                          <button 
                            onClick={() => handleEditPosition(position)}
                            className="text-primary-600 hover:text-primary-800 transition-colors duration-200"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                        {position.committee && (
                          <p className="text-sm text-primary-700 mb-2">{position.committee}</p>
                        )}
                        <p className="text-xs text-gray-600 mb-3">Since {formatDate(position.term_start)}</p>
                        <div className="flex space-x-2">
                          <span className="inline-block bg-primary-100 text-primary-800 px-2 py-1 rounded-full text-xs">Full-time</span>
                          <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Active</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-600 text-sm">No current position found</p>
                    </div>
                  )}
                  <button 
                    onClick={handleAddPosition}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2"
                  >
                    <span className="text-lg">+</span>
                    <span>Add New Position</span>
                  </button>
                </div>
              </section>

              {/* Past Positions */}
              {pastPositions.length > 0 && (
                <section className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <Clock className="text-gray-600 mr-2 h-5 w-5" />
                    Past Positions
                  </h2>
                  <div className="space-y-3">
                    {pastPositions.map(position => (
                      <div key={position.id} className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors duration-200">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-medium text-gray-800 text-sm">{position.position}</h4>
                          <button 
                            onClick={() => handleEditPosition(position)}
                            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                        </div>
                        {position.committee && (
                          <p className="text-xs text-gray-600 mb-1">{position.committee}</p>
                        )}
                        <p className="text-xs text-gray-500">{formatDate(position.term_start)} - {formatDate(position.term_end)}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Contact Information */}
              <section className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <Mail className="text-gray-600 mr-2 h-5 w-5" />
                  Contact Information
                </h2>
                <div className="space-y-3">
                  {official?.email && (
                    <div className="flex items-center space-x-3 text-sm">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700">{official.email}</span>
                    </div>
                  )}
                  {official?.phone && (
                    <div className="flex items-center space-x-3 text-sm">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700">{official.phone}</span>
                    </div>
                  )}
                  {official?.address && (
                    <div className="flex items-center space-x-3 text-sm">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700">{official.address}</span>
                    </div>
                  )}
                  {official?.birthdate && (
                    <div className="flex items-center space-x-3 text-sm">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700">Born: {formatDate(official.birthdate)}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-3 text-sm">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">Mon-Fri, 9:00 AM - 5:00 PM</span>
                  </div>
                </div>
              </section>

              {/* Record Information */}
              <section className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <Clock className="text-gray-600 mr-2 h-5 w-5" />
                  Record Information
                </h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Profile Created:</span>
                    <span className="text-gray-800 font-medium">{formatDateTime(official.created_at)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="text-gray-800 font-medium">{formatDateTime(official.updated_at)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Updated By:</span>
                    <span className="text-gray-800 font-medium">Admin User</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status:</span>
                    <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Active</span>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 text-sm">
                      <Clock className="h-4 w-4" />
                      <span>View Edit History</span>
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* Position Dialog */}
      <AddEditPositionDialog 
        open={isPositionDialogOpen} 
        onOpenChange={setIsPositionDialogOpen} 
        position={selectedPosition} 
        officialId={id || null} 
        onSuccess={() => {
          refetchPositions();
        }} 
      />

      {/* Edit Official Dialog */}
      <AddOfficialDialog 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen} 
        onSuccess={handleEditSuccess} 
        official={official} 
        position={currentPosition} 
      />

      {/* Cover Photo Modal */}
      <Dialog open={isCoverPhotoModalOpen} onOpenChange={setIsCoverPhotoModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0" hideCloseButton>
          <div className="relative">
            <button
              onClick={() => setIsCoverPhotoModalOpen(false)}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </button>
            {official?.coverurl && (
              <img
                src={official.coverurl}
                alt={`${official.name} cover photo`}
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Photo Modal */}
      <Dialog open={isProfilePhotoModalOpen} onOpenChange={setIsProfilePhotoModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0" hideCloseButton>
          <div className="relative">
            <button
              onClick={() => setIsProfilePhotoModalOpen(false)}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </button>
            {official?.photo_url && (
              <img
                src={official.photo_url}
                alt={`${official.name} profile photo`}
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OfficialDetailsPage;
