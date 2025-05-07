
import { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Mail, Phone, Calendar, GraduationCap, MapPin } from 'lucide-react';

// Official interface to match the data structure
interface Official {
  id: string;
  name: string;
  position: string;
  email?: string;
  phone?: string;
  photo_url: string;
  bio?: string;
  address?: string;
  birthdate?: string;
  education?: string;
  achievements?: string[] | null;
  committees?: string[] | null | any; // Accept different types to handle JSON
  created_at: string;
  updated_at: string;
  term_start: string;
  term_end?: string;
  is_sk: boolean | boolean[]; // Handle both potential types
  brgyid: string;
}

interface OfficialCardProps {
  official: Official;
}

const OfficialCard = ({ official }: OfficialCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Present';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle committees properly, ensuring it's always an array before mapping
  const getCommittees = (): string[] => {
    if (!official.committees) return [];
    
    // If it's already an array, return it
    if (Array.isArray(official.committees)) return official.committees;
    
    // If it's a JSON string, try to parse it
    if (typeof official.committees === 'string') {
      try {
        const parsed = JSON.parse(official.committees);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    
    // If it's an object with values that can be converted to an array
    if (typeof official.committees === 'object') {
      try {
        // Try to get values from the object
        const values = Object.values(official.committees);
        return Array.isArray(values) ? values : [];
      } catch (e) {
        return [];
      }
    }
    
    return [];
  };

  const fallbackInitials = official.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <Card 
      className="overflow-hidden transition-all duration-200 hover:shadow-md"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden">
        <Dialog>
          <DialogTrigger asChild>
            <div className="cursor-pointer">
              {official.photo_url ? (
                <img 
                  src={official.photo_url} 
                  alt={`${official.name} - ${official.position}`}
                  className="w-full h-64 object-cover object-center transition-transform duration-300 hover:scale-105"
                />
              ) : (
                <div className="w-full h-64 bg-muted flex items-center justify-center">
                  <Avatar className="h-24 w-24">
                    <AvatarFallback>{fallbackInitials}</AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{official.name}</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              {official.photo_url ? (
                <img 
                  src={official.photo_url} 
                  alt={`${official.name} - ${official.position}`}
                  className="max-h-[70vh] object-contain"
                />
              ) : (
                <div className="w-full h-64 bg-muted flex items-center justify-center">
                  <Avatar className="h-24 w-24">
                    <AvatarFallback>{fallbackInitials}</AvatarFallback>
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

        {/* Information overlay on hover */}
        <div 
          className={`absolute inset-0 bg-black bg-opacity-70 flex flex-col justify-end p-4 transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {official.email && (
            <div className="flex items-center text-white mb-2">
              <Mail className="w-4 h-4 mr-2" />
              <span className="text-sm">{official.email}</span>
            </div>
          )}
          {official.phone && (
            <div className="flex items-center text-white mb-2">
              <Phone className="w-4 h-4 mr-2" />
              <span className="text-sm">{official.phone}</span>
            </div>
          )}
          {official.education && (
            <div className="flex items-center text-white mb-2">
              <GraduationCap className="w-4 h-4 mr-2" />
              <span className="text-sm">{official.education}</span>
            </div>
          )}
          {official.address && (
            <div className="flex items-center text-white mb-2">
              <MapPin className="w-4 h-4 mr-2" />
              <span className="text-sm">{official.address}</span>
            </div>
          )}
          <div className="flex items-center text-white">
            <Calendar className="w-4 h-4 mr-2" />
            <span className="text-sm">
              {formatDate(official.term_start)} - {formatDate(official.term_end)}
            </span>
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-lg truncate">{official.name}</h3>
        <p className="text-muted-foreground">{official.position}</p>
      </CardContent>
      
      {/* Use the getCommittees helper function to safely map over committees */}
      {getCommittees().length > 0 && (
        <CardFooter className="px-4 pb-4 pt-0 flex gap-2 flex-wrap">
          {getCommittees().map((committee, i) => (
            <span key={i} className="text-xs bg-muted px-2 py-1 rounded-full">
              {committee}
            </span>
          ))}
        </CardFooter>
      )}
    </Card>
  );
};

export default OfficialCard;
