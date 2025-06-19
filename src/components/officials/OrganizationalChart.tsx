
import { Official } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Eye, Users } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface OrganizationalChartProps {
  officials: Official[];
  isLoading: boolean;
  error: Error | null;
}

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

  // Group officials by rank_number, only including those with assigned ranks
  const groupedOfficials = officials.reduce((groups, official) => {
    if (official.rank_number != null) {
      // Sort ranks numerically by converting string to number for sorting
      const rankKey = official.rank_number;
      if (!groups[rankKey]) groups[rankKey] = [];
      groups[rankKey].push(official);
    }
    return groups;
  }, {} as Record<string, Official[]>);

  // Sort ranks in ascending order (convert to numbers for proper sorting)
  const sortedRanks = Object.keys(groupedOfficials)
    .sort((a, b) => parseInt(a) - parseInt(b));

  const handleViewOfficial = (official: Official) => {
    setSelectedOfficial(official);
  };

  const getOfficialInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getRankLabel = (rank: string, officials: Official[]) => {
    // Use the first official's rank_label if available, otherwise use generic label
    const firstOfficial = officials[0];
    if (firstOfficial?.rank_label) {
      return firstOfficial.rank_label;
    }
    return `Rank ${rank} Officials`;
  };

  return (
    <div className="space-y-6">
      {sortedRanks.map((rank) => {
        const rankOfficials = groupedOfficials[rank];
        const rankLabel = getRankLabel(rank, rankOfficials);
        
        return (
          <Card key={rank} className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary">
                    <Users className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      {rankLabel}
                      <Badge variant="outline">
                        Rank {rank}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {rankOfficials.length} {rankOfficials.length === 1 ? 'Official' : 'Officials'}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="ml-auto">
                  {rankOfficials.length} {rankOfficials.length === 1 ? 'Official' : 'Officials'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {rankOfficials.map((official) => (
                  <div key={official.id} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                    <Avatar className="h-16 w-16 ring-2 ring-offset-2 ring-primary">
                      <AvatarImage src={official.photo_url} alt={official.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
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
                      {official.is_sk?.[0] && (
                        <Badge className="mt-1 text-xs" variant="secondary">
                          SK Official
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
            </CardContent>
          </Card>
        );
      })}

      {sortedRanks.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">
              No officials with assigned ranks found.
            </p>
            <p className="text-sm text-muted-foreground">
              Add officials and assign them ranks to see the organizational structure.
            </p>
          </CardContent>
        </Card>
      )}

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
                  {selectedOfficial.rank_number && (
                    <Badge variant="outline" className="mt-1">
                      Rank {selectedOfficial.rank_number}
                      {selectedOfficial.rank_label && `: ${selectedOfficial.rank_label}`}
                    </Badge>
                  )}
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
