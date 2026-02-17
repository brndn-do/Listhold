'use client';

import EventsView from '@/features/dashboard/components/EventsView';
import MembershipsView from '@/features/dashboard/components/MembershipsView';
import Spinner from '@/features/_shared/components/ui/Spinner';
import { useAuth } from '@/features/_shared/context/AuthProvider';
import Link from 'next/link';

const DashboardPage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Spinner />;
  }

  if (!user) {
    return (
      <div className='flex flex-col items-center gap-2'>
        <h1 className='text-xl font-bold'>Sign in to view your dashboard.</h1>
        <Link href='/' className='text-purple-600 underline dark:text-purple-400'>
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className='flex flex-col items-center gap-4'>
      <h1 className='text-2xl font-bold'>Your Organizations:</h1>
      <div className='w-full border-b border-dotted'></div>
      <MembershipsView />
      <EventsView />
    </div>
  );
};

export default DashboardPage;
