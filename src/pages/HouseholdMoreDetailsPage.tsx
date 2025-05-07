
import React from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const HouseholdMoreDetailsPage = () => {
  const { householdId } = useParams<{ householdId: string }>();
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/households')} 
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Households
      </Button>
      
      <Card className="p-6">
        <h1 className="text-3xl font-bold mb-4">Household Details</h1>
        <p className="mb-2">Household ID: {householdId}</p>
        <p>Detailed household information will be displayed here.</p>
      </Card>
    </div>
  );
};

export default HouseholdMoreDetailsPage;
