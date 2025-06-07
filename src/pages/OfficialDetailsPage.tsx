import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, GraduationCap, Award, Briefcase, User, Users, Edit, Clock } from 'lucide-react';
import { Official, OfficialPosition } from '@/lib/types';
import { AddEditPositionDialog } from '@/components/officials/AddEditPositionDialog';
import { Badge } from '@/components/ui/badge';
import { AddOfficialDialog } from '@/components/officials/AddOfficialDialog';
const OfficialDetailsPage = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const [isPositionDialogOpen, setIsPositionDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<OfficialPosition | null>(null);

  // Fetch official details
  const {
    data: official,
    isLoading: officialLoading,
    refetch: refetchOfficial
  } = useQuery({
    queryKey: ['official-details-page', id],
    queryFn: async () => {
      if (!id) return null;
      const {
        data,
        error
      } = await supabase.from('officials').select('*').eq('id', id).single();
      if (error) throw error;
      return data as Official;
    },
    enabled: !!id
  });

  // Fetch positions for the official
  const {
    data: positions,
    isLoading: positionsLoading,
    refetch: refetchPositions
  } = useQuery({
    queryKey: ['official-positions-page', id],
    queryFn: async () => {
      if (!id) return [];
      const {
        data,
        error
      } = await supabase.from('official_positions').select('*').eq('official_id', id).order('term_start', {
        ascending: false
      });
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

    // Handle different formats of the achievements field
    if (Array.isArray(achievements)) {
      achievementItems = achievements;
    } else if (typeof achievements === 'object') {
      // If it's a JSON object, try to extract values
      achievementItems = Object.values(achievements).map(item => String(item));
    } else if (typeof achievements === 'string') {
      // If it's a string, try to parse it as JSON
      try {
        const parsed = JSON.parse(achievements);
        if (Array.isArray(parsed)) {
          achievementItems = parsed;
        } else if (typeof parsed === 'object') {
          achievementItems = Object.values(parsed).map(item => String(item));
        }
      } catch {
        // If parsing fails, just use the string itself
        achievementItems = [achievements];
      }
    }
    if (achievementItems.length === 0) return null;
    return <ul className="list-disc pl-5 space-y-2">
        {achievementItems.map((achievement, i) => <li key={i} className="text-muted-foreground whitespace-pre-line">{achievement}</li>)}
      </ul>;
  };

  // Format committees into bullet points
  const formatCommittees = (committees: any) => {
    if (!committees) return null;
    let committeeItems: string[] = [];

    // Handle different formats of the committees field
    if (Array.isArray(committees)) {
      committeeItems = committees;
    } else if (typeof committees === 'object') {
      // If it's a JSON object, try to extract values
      committeeItems = Object.values(committees).map(item => String(item));
    } else if (typeof committees === 'string') {
      // If it's a string, try to parse it as JSON
      try {
        const parsed = JSON.parse(committees);
        if (Array.isArray(parsed)) {
          committeeItems = parsed;
        } else if (typeof parsed === 'object') {
          committeeItems = Object.values(parsed).map(item => String(item));
        }
      } catch {
        // If parsing fails, just use the string itself
        committeeItems = [committees];
      }
    }
    if (committeeItems.length === 0) return null;
    return <ul className="list-disc pl-5 space-y-2">
        {committeeItems.map((committee, i) => <li key={i} className="text-muted-foreground whitespace-pre-line">{committee}</li>)}
      </ul>;
  };

  // Format education into bullet points
  const formatEducation = (educ: any) => {
    if (!educ) return null;
    let educItems: string[] = [];

    // Handle different formats of the educ field
    if (Array.isArray(educ)) {
      educItems = educ;
    } else if (typeof educ === 'object') {
      // If it's a JSON object, try to extract values
      educItems = Object.values(educ).map(item => String(item));
    } else if (typeof educ === 'string') {
      // If it's a string, try to parse it as JSON
      try {
        const parsed = JSON.parse(educ);
        if (Array.isArray(parsed)) {
          educItems = parsed;
        } else if (typeof parsed === 'object') {
          educItems = Object.values(parsed).map(item => String(item));
        }
      } catch {
        // If parsing fails, just use the string itself
        educItems = [educ];
      }
    }
    if (educItems.length === 0) return null;
    return <ul className="list-disc pl-5 space-y-2">
        {educItems.map((education, i) => <li key={i} className="text-muted-foreground whitespace-pre-line">{education}</li>)}
      </ul>;
  };

  // Filter positions into current and past
  const currentPositions = positions?.filter(position => !position.term_end || new Date(position.term_end) >= new Date()) || [];
  const pastPositions = positions?.filter(position => position.term_end && new Date(position.term_end) < new Date()) || [];
  const handleAddPosition = () => {
    setSelectedPosition(null);
    setIsPositionDialogOpen(true);
  };
  const handleEditPosition = (position: OfficialPosition) => {
    setSelectedPosition(position);
    setIsPositionDialogOpen(true);
  };
  const handleEditOfficial = () => {
    setIsEditDialogOpen(true);
  };
  const handleEditSuccess = () => {
    refetchOfficial();
    refetchPositions();
  };
  const goBack = () => {
    navigate(-1);
  };
  if (officialLoading) {
    return <div className="p-6 min-h-screen bg-background">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-80" />
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-32" />
              <Skeleton className="h-6" />
              <Skeleton className="h-6" />
            </div>
          </div>
        </div>
      </div>;
  }
  if (!official) {
    return <div className="p-6 min-h-screen bg-background text-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Official Not Found</h2>
          <p className="mb-4">The official you are looking for could not be found.</p>
          <Button onClick={goBack} variant="outline">Go Back</Button>
        </div>
      </div>;
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
  return <div className="p-6 min-h-screen bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Button onClick={goBack} variant="ghost" className="p-1 hover:bg-accent">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Official Details</h1>
          </div>
          <Button onClick={handleEditOfficial} className="bg-primary hover:bg-primary/90 flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Edit Official
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column - Photo and basic info */}
          <div className="space-y-6">
            <Card className="overflow-hidden bg-card border">
              <div className="h-80 relative">
                {official?.photo_url ? <img src={official.photo_url} alt={official.name} className="w-full h-full object-cover object-center" /> : <div className="w-full h-full bg-muted flex items-center justify-center">
                    <User className="h-24 w-24 text-muted-foreground" />
                  </div>}
              </div>
              
              <div className="p-4 space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{official?.name}</h2>
                  <p className="text-primary">{currentPosition?.position || 'Barangay Official'}</p>
                </div>
                
                <div className="space-y-2 text-muted-foreground">
                  {official?.email && <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{official.email}</span>
                    </div>}
                  
                  {official?.phone && <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{official.phone}</span>
                    </div>}
                  
                  {official?.address && <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                      <span>{official.address}</span>
                    </div>}
                  
                  {official?.birthdate && <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Born: {formatDate(official.birthdate)}</span>
                    </div>}
                </div>
              </div>
            </Card>
          </div>
          
          {/* Right Column - Detailed information */}
          <div className="md:col-span-2 space-y-6">
            {/* Biography Section */}
            <Card className="bg-card border p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Biography</h2>
              <p className="text-muted-foreground whitespace-pre-line">
                {official?.bio || `${official?.name || 'This official'} is a dedicated public servant working for the betterment of the community.`}
              </p>
            </Card>
            
            {/* Committees Section */}
            {official?.committees && <Card className="bg-card border p-6">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Committees
                </h2>
                <div className="text-muted-foreground">
                  {formatCommittees(official.committees)}
                </div>
              </Card>}
            
            {/* Education Section */}
            {official?.educ && <Card className="bg-card border p-6">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Education
                </h2>
                <div className="text-muted-foreground">
                  {formatEducation(official.educ)}
                </div>
              </Card>}
            
            {/* Achievements Section */}
            {official?.achievements && <Card className="bg-card border p-6">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Achievements
                </h2>
                <div className="text-muted-foreground">
                  {formatAchievements(official.achievements)}
                </div>
              </Card>}
            
            {/* Positions Section */}
            <Card className="bg-card border p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Positions
                </h2>
                <Button onClick={handleAddPosition} className="bg-primary hover:bg-primary/90">
                  Add Position
                </Button>
              </div>
              
              <Tabs defaultValue="current" className="w-full">
                <TabsList className="w-full bg-muted mb-4">
                  <TabsTrigger value="current" className="flex-1">Current Positions ({currentPositions.length})</TabsTrigger>
                  <TabsTrigger value="past" className="flex-1">Past Positions ({pastPositions.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="current">
                  {positionsLoading ? <Skeleton className="h-32 w-full" /> : currentPositions.length > 0 ? <div className="space-y-4">
                      {currentPositions.map(position => <Card key={position.id} className="bg-muted border p-4">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="font-bold text-foreground">{position.position}</h3>
                              {position.committee && <p className="text-primary">Committee: {position.committee}</p>}
                              <p className="text-muted-foreground text-sm mt-2">
                                {formatDate(position.term_start)} - {formatDate(position.term_end)}
                              </p>
                              {position.description && <p className="text-muted-foreground mt-2">{position.description}</p>}
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleEditPosition(position)}>
                              Edit
                            </Button>
                          </div>
                        </Card>)}
                    </div> : <p className="text-muted-foreground py-4 text-center">No current positions found.</p>}
                </TabsContent>
                
                <TabsContent value="past">
                  {positionsLoading ? <Skeleton className="h-32 w-full" /> : pastPositions.length > 0 ? <div className="space-y-4">
                      {pastPositions.map(position => <Card key={position.id} className="bg-muted border p-4">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="font-bold text-foreground">{position.position}</h3>
                              {position.committee && <p className="text-primary">Committee: {position.committee}</p>}
                              <p className="text-muted-foreground text-sm mt-2">
                                {formatDate(position.term_start)} - {formatDate(position.term_end)}
                              </p>
                              {position.description && <p className="text-muted-foreground mt-2">{position.description}</p>}
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleEditPosition(position)}>
                              Edit
                            </Button>
                          </div>
                        </Card>)}
                    </div> : <p className="text-muted-foreground py-4 text-center">No past positions found.</p>}
                </TabsContent>
              </Tabs>
            </Card>

            {/* Record Information Section */}
            <Card className="bg-card border p-6">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Record Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Created</h3>
                  <p className="text-muted-foreground">{formatDateTime(official.created_at)}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Last Updated</h3>
                  <p className="text-muted-foreground">{formatDateTime(official.updated_at)}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Position Dialog */}
      <AddEditPositionDialog open={isPositionDialogOpen} onOpenChange={setIsPositionDialogOpen} position={selectedPosition} officialId={id || null} onSuccess={() => {
      refetchPositions();
    }} />

      {/* Edit Official Dialog */}
      <AddOfficialDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} onSuccess={handleEditSuccess} official={official} position={currentPosition} />
    </div>;
};
export default OfficialDetailsPage;