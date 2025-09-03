import React from 'react';
import PublicPageLayout from '@/components/public/PublicPageLayout';
import UserAnnouncementsPage from '@/components/user/UserAnnouncementsPage';

const PublicAnnouncementsPage = () => {
  return (
    <PublicPageLayout>
      <UserAnnouncementsPage />
    </PublicPageLayout>
  );
};

export default PublicAnnouncementsPage;