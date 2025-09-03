import React from 'react';
import PublicPageLayout from '@/components/public/PublicPageLayout';
import UserCalendarPage from '@/components/user/UserCalendarPage';

const PublicEventsPage = () => {
  return (
    <PublicPageLayout>
      <UserCalendarPage />
    </PublicPageLayout>
  );
};

export default PublicEventsPage;