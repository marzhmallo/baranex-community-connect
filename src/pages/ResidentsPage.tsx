
import React from 'react';
import ResidentsList from '@/components/residents/ResidentsList';

const ResidentsPage = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Resident Registry</h1>
      <ResidentsList />
    </div>
  );
};

export default ResidentsPage;
