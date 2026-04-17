import React from 'react';
import { Dashboard } from '@/src/components/platform/Dashboard';
import { PlatformLayout } from '@/src/components/platform/PlatformLayout';

export const DashboardPage = () => {
  return (
    <PlatformLayout>
      <Dashboard />
    </PlatformLayout>
  );
};
