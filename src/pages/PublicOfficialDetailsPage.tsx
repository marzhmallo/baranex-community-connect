import React from 'react';
import PublicPageLayout from '@/components/public/PublicPageLayout';
import UserOfficialDetailsPage from '@/components/user/UserOfficialDetailsPage';

const PublicOfficialDetailsPage = () => {
  return (
    <PublicPageLayout>
      <UserOfficialDetailsPage />
    </PublicPageLayout>
  );
};

export default PublicOfficialDetailsPage;