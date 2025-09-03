import React from 'react';
import PublicPageLayout from '@/components/public/PublicPageLayout';
import UserForumPage from '@/components/user/UserForumPage';

const PublicForumPage = () => {
  return (
    <PublicPageLayout title="Community Forum">
      <UserForumPage />
    </PublicPageLayout>
  );
};

export default PublicForumPage;