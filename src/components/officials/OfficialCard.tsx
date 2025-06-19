
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Mail, Phone, Eye, Search, Info, ExternalLink } from 'lucide-react';
import { Official } from '@/lib/types';
import { OfficialDetailsDialog } from './OfficialDetailsDialog';

interface OfficialCardProps {
  official: Official;
}

const OfficialCard = ({
  official
}: OfficialCardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Present';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
  };

  // Extract short description from bio or generate a default one
  const getShortDescription = () => {
    if (official.bio) {
      return official.bio.length > 150 ? official.bio.substring(0, 150) + '...' : official.bio;
    }
    return `${official.name} serves as ${official.position || 'an official'} in the barangay administration. They work to ensure the best service for the community.`;
  };

  // Get the position from official_positions
  const getPosition = () => {
    if (official.officialPositions && official.officialPositions.length > 0) {
      // Find the current position (no term_end or term_end in future)
      const currentPositions = official.officialPositions.filter(pos => 
        !pos.term_end || new Date(pos.term_end) >= new Date()
      );
      
      if (currentPositions.length > 0) {
        return currentPositions[0].position || '';
      }
      
      // If no current position, return the most recent one
      return official.officialPositions[0].position || '';
    }
    
    // Fallback to official.position for backwards compatibility
    return official.position || '';
  };

  // Get the term start date
  const getTermStart = () => {
    if (official.officialPositions && official.officialPositions.length > 0) {
      const currentPosition = official.officialPositions[0];
      return currentPosition.term_start;
    }
    return official.term_start;
  };

  // Get the term end date
  const getTermEnd = () => {
    if (official.officialPositions && official.officialPositions.length > 0) {
      const currentPosition = official.officialPositions[0];
      return currentPosition.term_end;
    }
    return official.term_end;
  };
  
  const handleViewFullDetails = () => {
    // Check if we're in the admin context or user context
    const isUserContext = location.pathname.startsWith('/hub');
    
    if (isUserContext) {
      // User context - navigate to user official details page
      navigate(`/hub/user-officials/${official.id}`);
    } else {
      // Admin context - navigate to admin official details page
      navigate(`/officials/${official.id}`);
    }
  };
  
  return (
    <Card className="overflow-hidden bg-card text-card-foreground border-border h-full">
      <div className="relative">
        {/* Photo section with hover effect */}
        <Dialog>
          <DialogTrigger asChild>
            <div 
              className="relative cursor-pointer h-80 overflow-hidden" 
              onMouseEnter={() => setIsHovered(true)} 
              onMouseLeave={() => setIsHovered(false)}
            >
              {official.photo_url ? (
                <img 
                  src={official.photo_url} 
                  alt={`${official.name} - ${getPosition()}`} 
                  className="w-full h-full object-cover object-center transition-transform duration-300" 
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Avatar className="h-32 w-32 bg-secondary text-secondary-foreground">
                    <span className="text-3xl font-medium">
                      {official.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </span>
                  </Avatar>
                </div>
              )}
              
              {/* Magnify icon overlay on hover */}
              {isHovered && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <Search className="w-8 h-8 text-white" />
                </div>
              )}
            </div>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-md bg-card border-border text-card-foreground">
            <DialogHeader>
              <DialogTitle className="text-card-foreground">{official.name}</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              {official.photo_url ? (
                <img 
                  src={official.photo_url} 
                  alt={`${official.name} - ${getPosition()}`} 
                  className="max-h-[70vh] object-contain" 
                />
              ) : (
                <div className="w-full h-64 bg-muted flex items-center justify-center">
                  <Avatar className="h-24 w-24 bg-secondary text-secondary-foreground">
                    <span className="text-2xl font-medium">
                      {official.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </span>
                  </Avatar>
                </div>
              )}
            </div>
            <DialogClose asChild>
              <Button type="button" variant="secondary" className="mt-2">
                Close
              </Button>
            </DialogClose>
          </DialogContent>
        </Dialog>
      </div>

      <div className="p-6 flex flex-col h-auto min-h-[300px]">
        {/* Official name and position */}
        <h3 className="font-bold text-xl text-foreground mb-2 break-words">{official.name}</h3>
        <p className="text-primary mb-4 text-base break-words">{getPosition()}</p>
        
        {/* Description */}
        <div className="flex-grow mb-4">
          <p className="text-muted-foreground text-sm leading-relaxed break-words">
            {getShortDescription()}
          </p>
        </div>
        
        {/* Contact information */}
        <div className="space-y-3 mb-4">
          {official.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm break-all">{official.email}</span>
            </div>
          )}
          
          {official.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{official.phone}</span>
            </div>
          )}
        </div>
        
        {/* Term duration */}
        <div className="flex flex-col gap-3 mt-auto">
          <div className="text-muted-foreground text-sm">
            <span className="font-medium">Term:</span> {formatDate(getTermStart())} - {formatDate(getTermEnd())}
          </div>
          
          {/* View and More Details buttons */}
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-transparent border-border text-foreground hover:bg-accent hover:text-accent-foreground flex-1">
                  <Eye className="w-4 h-4 mr-1" /> View
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border text-card-foreground max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-card-foreground">{official.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <img 
                    src={official.photo_url || '/placeholder.svg'} 
                    alt={official.name} 
                    className="w-full max-h-64 object-cover object-center rounded-md" 
                  />
                  <div>
                    <h4 className="font-bold text-lg">{getPosition()}</h4>
                    <p className="text-muted-foreground mt-2 leading-relaxed">{official.bio || getShortDescription()}</p>
                  </div>
                  
                  <div className="space-y-2">
                    {official.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{official.email}</span>
                      </div>
                    )}
                    
                    {official.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{official.phone}</span>
                      </div>
                    )}
                    
                    {official.education && (
                      <div>
                        <span className="font-medium">Education:</span> {official.education}
                      </div>
                    )}
                    
                    <div>
                      <span className="font-medium">Term:</span> {formatDate(getTermStart())} - {formatDate(getTermEnd())}
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button onClick={handleViewFullDetails} className="bg-primary hover:bg-primary/90">
                      <ExternalLink className="w-4 h-4 mr-1" /> More Details
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Details Dialog */}
      <OfficialDetailsDialog 
        officialId={official.id} 
        open={detailsDialogOpen} 
        onOpenChange={setDetailsDialogOpen} 
      />
    </Card>
  );
};

export default OfficialCard;
