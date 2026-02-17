/**
 * A dashboard summarizing the authenticated user
 *
 * - Header summary
 * - Organizations they are involved in
 * - Events they have joined or been waitlisted
 * - Past events (attended primary, waitlisted secondary)
 */

import DashboardPage from '@/features/dashboard/components/DashboardPage';
import { Metadata } from 'next';

export const revalidate = false;

export const metadata: Metadata = {
  title: 'Dashboard — Listhold',
  description: 'View your organizations and events',
};

const Dashboard = () => <DashboardPage />;

export default Dashboard;
