'use client';

import { useAuth } from '@/context/AuthProvider';
import Link from 'next/link';
import Spinner from '../ui/Spinner';

interface OrganizationViewProps {
  organizationId: string;
  ownerId: string;
}

const OrganizationView = ({ organizationId, ownerId }: OrganizationViewProps) => {
  const { user, loading } = useAuth();
  if (loading) {
    return <Spinner />;
  }
  if (user?.uid !== ownerId) {
    return <></>;
  }
  return (
    <Link href={`/organizations/${encodeURI(organizationId)}/events/new`}>
      <p className='text-purple-600 dark:text-purple-500 underline'>Create Event</p>
    </Link>
  );
};

export default OrganizationView;
