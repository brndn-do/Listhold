'use client';

import { useAuth } from '@/context/AuthProvider';
import Link from 'next/link';

interface CreateEventLinkProps {
  orgSlug: string;
  ownerId: string;
}

const CreateEventLink = ({ orgSlug, ownerId }: CreateEventLinkProps) => {
  const { user, loading } = useAuth();
  if (loading || !user || user.uid !== ownerId) {
    return <div className='h-8'></div>;
  }
  return (
    <Link className='h-8' href={`/organizations/${encodeURI(orgSlug)}/events/new`}>
      <p className='text-purple-600 dark:text-purple-500 underline'>Create Event</p>
    </Link>
  );
};

export default CreateEventLink;
