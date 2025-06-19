
import { Official } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Eye, Users, Crown, Award, Shield, HeartHandshake, Building2, FileText, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface OrganizationalChartProps {
  officials: Official[];
  isLoading: boolean;
  error: Error | null;
}

// Define rank configurations with icons and colors
const RANK_CONFIG = {
  1: { 
    title: 'Barangay Captain', 
    description: 'Top Executive Officer', 
    icon: Crown, 
    color: 'bg-purple-500',
    badgeColor: 'bg-purple-100 text-purple-800'
  },
  2: { 
    title: 'Barangay Councilors', 
    description: 'Legislative team responsible for creating barangay ordinances and resolutions', 
    icon: Users, 
    color: 'bg-blue-500',
    badgeColor: 'bg-blue-100 text-blue-800'
  },
  3: { 
    title: 'SK Chairperson', 
    description: 'Youth Representative', 
    icon: Award, 
    color: 'bg-purple-600',
    badgeColor: 'bg-purple-100 text-purple-800'
  },
  4: { 
    title: 'Barangay Secretary', 
    description: 'Appointed Official', 
    icon: FileText, 
    color: 'bg-orange-500',
    badgeColor: 'bg-orange-100 text-orange-800'
  },
  5: { 
    title: 'Barangay Treasurer', 
    description: 'Appointed Official', 
    icon: DollarSign, 
    color: 'bg-green-500',
    badgeColor: 'bg-green-100 text-green-800'
  },
  6: { 
    title: 'Barangay Tanod', 
    description: 'Security force responsible for peace and order (non-elected)', 
    icon: Shield, 
    color: 'bg-red-500',
    badgeColor: 'bg-red-100 text-red-800'
  },
  7: { 
    title: 'Health Workers', 
    description: 'Health & nutrition aides', 
    icon: HeartHandshake, 
    color: 'bg-teal-500',
    badgeColor: 'bg-teal-100 text-teal-800'
  },
  8: { 
    title: 'Lupong Tagapamayapa', 
    description: 'Community conflict resolution', 
    icon: Building2, 
    color: 'bg-indigo-500',
    badgeColor: 'bg-indigo-100 text-indigo-800'
  },
  9: { 
    title: 'Other Staff', 
    description: 'Based on barangay\'s needs and budget', 
    icon: Users, 
    color: 'bg-gray-500',
    badgeColor: 'bg-gray-100 text-gray-800'
  }
};

export const OrganizationalChart = ({ officials, isLoading, error }: OrganizationalChartProps) => {
  const [selectedOfficial, setSelectedOfficial] = useState<Official | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((rank) => (
          <Card key={rank} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-32 bg-muted rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-destructive bg-card rounded-lg border">
        Error loading officials: {error.message}
      </div>
    );
  }

  // Group officials by rank (using a simple position-based ranking for now)
  const groupedOfficials = officials.reduce((groups, official) => {
    let rank = 9; // Default to "Other Staff"
    
    const position = official.position?.toLowerCase() || '';
    
    if (position.includes('captain')) rank = 1;
    else if (position.includes('councilor')) rank = 2;
    else if (position.includes('sk') && position.includes('chairperson')) rank = 3;
    else if (position.includes('secretary')) rank = 4;
    else if (position.includes('treasurer')) rank = 5;
    else if (position.includes('tanod')) rank = 6;
    else if (position.includes('health') || position.includes('bhw')) rank = 7;
    else if (position.includes('lupong') || position.includes('tagapamayapa')) rank = 8;
    
    if (!groups[rank]) groups[rank] = [];
    groups[rank].push(official);
    return groups;
  }, {} as Record<number, Official[]>);

  // Sort ranks in ascending order
  const sortedRanks = Object.keys(groupedOfficials)
    .map(Number)
    .sort((a, b) => a - b);

  const handleViewOfficial = (official: Official) => {
    setSelectedOfficial(official);
  };

  const getOfficialInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {sortedRanks.map((rank) => {
        const config = RANK_CONFIG[rank as keyof typeof RANK_CONFIG];
        const rankOfficials = groupedOfficials[rank];
        const IconComponent = config?.icon || Users;
        
        return (
          <Card key={rank} className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${config?.color || 'bg-gray-500'}`}>
                    <IconComponent className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      {config?.title || `Rank ${rank}`}
                      <Badge className={`${config?.badgeColor || 'bg-gray-100 text-gray-800'} border-0`}>
                        Rank {rank}
                      </Badge>
                    </CardTitle>
                    {config?.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {config.description}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className="ml-auto">
                  {rankOfficials.length} {rankOfficials.length === 1 ? 'Official' : 'Officials'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {rank === 2 ? (
                // Special layout for councilors (grid layout)
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {rankOfficials.map((official, index) => (
                    <div key={official.id} className="flex flex-col items-center p-4 bg-muted/30 rounded-lg">
                      <Avatar className={`h-16 w-16 mb-3 ring-2 ring-offset-2 ${config?.color || 'ring-gray-500'}`}>
                        <AvatarImage src={official.photo_url} alt={official.name} />
                        <AvatarFallback className={`${config?.color || 'bg-gray-500'} text-white`}>
                          {getOfficialInitials(official.name)}
                        </AvatarFallback>
                      </Avatar>
                      <h4 className="font-medium text-center text-sm">
                        Councilor {index + 1}
                      </h4>
                      <p className="text-xs text-muted-foreground text-center mt-1">
                        {official.name}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 h-7 text-xs"
                        onClick={() => handleViewOfficial(official)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              ) : rank === 6 ? (
                // Special layout for Tanods (horizontal scroll)
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {rankOfficials.map((official, index) => (
                    <div key={official.id} className="flex flex-col items-center p-3 bg-muted/30 rounded-lg">
                      <Avatar className={`h-12 w-12 mb-2 ring-2 ring-offset-1 ${config?.color || 'ring-gray-500'}`}>
                        <AvatarImage src={official.photo_url} alt={official.name} />
                        <AvatarFallback className={`${config?.color || 'bg-gray-500'} text-white text-xs`}>
                          {getOfficialInitials(official.name)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-xs font-medium text-center">
                        Tanod {index + 1}
                      </p>
                      <p className="text-xs text-muted-foreground text-center">
                        {official.name}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                // Default layout for other ranks
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rankOfficials.map((official) => (
                    <div key={official.id} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                      <Avatar className={`h-16 w-16 ring-2 ring-offset-2 ${config?.color || 'ring-gray-500'}`}>
                        <AvatarImage src={official.photo_url} alt={official.name} />
                        <AvatarFallback className={`${config?.color || 'bg-gray-500'} text-white`}>
                          {getOfficialInitials(official.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {official.name}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {official.position}
                        </p>
                        {rank === 1 && (
                          <Badge className="mt-1 text-xs" variant="outline">
                            Elected
                          </Badge>
                        )}
                        {rank === 3 && (
                          <Badge className="mt-1 text-xs" variant="outline">
                            Elected
                          </Badge>
                        )}
                        {(rank === 4 || rank === 5) && (
                          <Badge className="mt-1 text-xs bg-orange-100 text-orange-800 border-0">
                            Appointed
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewOfficial(official)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {sortedRanks.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No officials found in the current selection.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Organization Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Organization Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {groupedOfficials[1]?.length || 0}
              </div>
              <div className="text-sm text-purple-600">Barangay Captain</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {groupedOfficials[2]?.length || 0}
              </div>
              <div className="text-sm text-blue-600">Councilors</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {(groupedOfficials[4]?.length || 0) + (groupedOfficials[5]?.length || 0)}
              </div>
              <div className="text-sm text-green-600">Appointed Officials</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {Object.values(groupedOfficials).reduce((total, officials) => total + officials.length, 0) - 
                 (groupedOfficials[1]?.length || 0) - (groupedOfficials[2]?.length || 0) - 
                 (groupedOfficials[4]?.length || 0) - (groupedOfficials[5]?.length || 0)}
              </div>
              <div className="text-sm text-orange-600">Support Staff</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Official Details Dialog */}
      <Dialog open={!!selectedOfficial} onOpenChange={() => setSelectedOfficial(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedOfficial?.name}</DialogTitle>
          </DialogHeader>
          {selectedOfficial && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={selectedOfficial.photo_url} alt={selectedOfficial.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getOfficialInitials(selectedOfficial.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedOfficial.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedOfficial.position}</p>
                </div>
              </div>
              
              {selectedOfficial.bio && (
                <div>
                  <h4 className="font-medium mb-2">About</h4>
                  <p className="text-sm text-muted-foreground">{selectedOfficial.bio}</p>
                </div>
              )}
              
              <div className="space-y-2">
                {selectedOfficial.email && (
                  <div className="text-sm">
                    <span className="font-medium">Email:</span> {selectedOfficial.email}
                  </div>
                )}
                {selectedOfficial.phone && (
                  <div className="text-sm">
                    <span className="font-medium">Phone:</span> {selectedOfficial.phone}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
