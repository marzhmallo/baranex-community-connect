
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Mail, Phone, Eye, Search, Info } from 'lucide-react';
import { Official } from '@/lib/types';
import { OfficialDetailsDialog } from './OfficialDetailsDialog';

interface OfficialCardProps {
  official: Official;
}

const OfficialCard = ({ official }: OfficialCardProps) => {
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
      return official.bio.length > 120 ? official.bio.substring(0, 120) + '...' : official.bio;
    }
    return `${official.name} serves as ${official.position || 'an official'} in the barangay administration. They work to ensure the best service for the community.`;
  };

  // Get the position
  const getPosition = () => {
    return official.position || '';
  };

  // Get the term start date
  const getTermStart = () => {
    return official.term_start;
  };

  // Get the term end date
  const getTermEnd = () => {
    return official.term_end;
  };

  return (
    <Card className="overflow-hidden bg-[#1e2637] text-white border-none">
      <div className="relative">
        {/* Photo section with hover effect */}
        <Dialog>
          <DialogTrigger asChild>
            <div 
              className="relative cursor-pointer h-64 overflow-hidden"
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
                <div className="w-full h-full bg-[#202a3c] flex items-center justify-center">
                  <Avatar className="h-24 w-24 bg-[#2a3649] text-white">
                    <span className="text-2xl font-medium">
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
          
          <DialogContent className="sm:max-w-md bg-[#1e2637] border-[#2a3649] text-white">
            <DialogHeader>
              <DialogTitle className="text-white">{official.name}</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              {official.photo_url ? (
                <img 
                  src={official.photo_url} 
                  alt={`${official.name} - ${getPosition()}`}
                  className="max-h-[70vh] object-contain"
                />
              ) : (
                <div className="w-full h-64 bg-[#202a3c] flex items-center justify-center">
                  <Avatar className="h-24 w-24 bg-[#2a3649] text-white">
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

      <div className="p-5">
        {/* Official name and position */}
        <h3 className="font-bold text-xl text-white">{official.name}</h3>
        <p className="text-blue-400 mb-4">{getPosition()}</p>
        
        {/* Description */}
        <p className="text-gray-300 text-sm mb-4">
          {getShortDescription()}
        </p>
        
        {/* Contact information */}
        {official.email && (
          <div className="flex items-center gap-2 text-gray-300 mb-2">
            <Mail className="w-4 h-4" />
            <span className="text-sm">{official.email}</span>
          </div>
        )}
        
        {official.phone && (
          <div className="flex items-center gap-2 text-gray-300 mb-4">
            <Phone className="w-4 h-4" />
            <span className="text-sm">{official.phone}</span>
          </div>
        )}
        
        {/* Term duration */}
        <div className="flex justify-between items-center mt-4">
          <div className="text-gray-400 text-sm">
            Term: {formatDate(getTermStart())} - {formatDate(getTermEnd())}
          </div>
          
          {/* View and More Details buttons */}
          <div className="flex gap-2">
            <Button variant="outline" className="bg-transparent border-[#2a3649] text-white hover:bg-[#2a3649]" onClick={() => setDetailsDialogOpen(true)}>
              <Info className="w-4 h-4 mr-1" /> More Details
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-transparent border-[#2a3649] text-white hover:bg-[#2a3649]">
                  <Eye className="w-4 h-4 mr-1" /> View
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1e2637] border-[#2a3649] text-white">
                <DialogHeader>
                  <DialogTitle className="text-white">{official.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <img 
                    src={official.photo_url || '/placeholder.svg'} 
                    alt={official.name}
                    className="w-full max-h-64 object-cover object-center rounded-md"
                  />
                  <div>
                    <h4 className="font-bold">{getPosition()}</h4>
                    <p className="text-gray-300 mt-2">{official.bio || getShortDescription()}</p>
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
