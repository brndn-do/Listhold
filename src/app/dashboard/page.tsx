/**
 * A dashboard summarizing the authenticated user
 *
 * - Header summary
 * - Organizations they are involved in
 * - Events they have joined or been waitlisted
 * - Past events (attended primary, waitlisted secondary)
 */

import DashboardView from '@/components/dashboard/DashboardView';
import { Metadata } from 'next';

export const generateMetadata = async (): Promise<Metadata> => {
  return {
    title: 'Dashboard—Rosterize',
    description: 'View your organizations and events',
  };
};

const DashboardPage = () => (
  <div className='w-full p-8'>
    <DashboardView />
  </div>
);

export default DashboardPage;
