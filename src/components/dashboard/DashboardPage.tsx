'use client';

import EventsView from '@/components/dashboard/EventsView';
import MembershipsView from '@/components/dashboard/MembershipsView';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '@/context/AuthProvider';
import Link from 'next/link';

const DashboardPage = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return <Spinner />;
  }
  if (!user) {
    return (
      <div className='flex flex-col gap-2 items-center'>
        <h1 className='text-xl font-bold'>Sign in to view your dashboard.</h1>
        <Link href='/' className='text-purple-700 dark:text-purple-500 underline'>
          Back to Home
        </Link>
      </div>
    );
  }
  return (
    <div className='flex flex-col gap-4 items-center'>
      <h1 className='text-2xl font-bold'>Your Organizations:</h1>
      <div className='w-full border-b border-dotted'></div>
      <MembershipsView />
      <EventsView />
    </div>
  );
};

export default DashboardPage;
