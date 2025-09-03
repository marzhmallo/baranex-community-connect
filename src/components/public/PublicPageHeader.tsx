import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

interface PublicPageHeaderProps {
  title: string;
}

export const PublicPageHeader: React.FC<PublicPageHeaderProps> = ({ title }) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="flex items-center justify-between mb-6 pb-4 border-b">
      <h1 className="text-2xl font-bold">{title}</h1>
      <Button 
        variant="outline" 
        onClick={handleGoHome}
        className="flex items-center gap-2"
      >
        <Home className="h-4 w-4" />
        Back to Home
      </Button>
    </div>
  );
};