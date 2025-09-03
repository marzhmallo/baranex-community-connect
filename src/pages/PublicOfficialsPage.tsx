import React from 'react';
import PublicPageLayout from '@/components/public/PublicPageLayout';
import UserOfficialsPage from '@/components/user/UserOfficialsPage';

const PublicOfficialsPage = () => {
  return (
    <PublicPageLayout>
      <UserOfficialsPage />
    </PublicPageLayout>
  );
};

export default PublicOfficialsPage;