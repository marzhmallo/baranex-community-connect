import React from 'react';
import PublicPageLayout from '@/components/public/PublicPageLayout';
import UserEmergencyPage from '@/components/user/UserEmergencyPage';

const PublicEmergencyPage = () => {
  return (
    <PublicPageLayout title="Emergency Services">
      <UserEmergencyPage />
    </PublicPageLayout>
  );
};

export default PublicEmergencyPage;