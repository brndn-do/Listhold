'use client';

import EventForm from '@/components/organization/EventForm';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '@/context/AuthProvider';

interface CreateEventPageProps {
  orgSlug: string;
  orgName: string;
  orgOwnerId: string;
}

const CreateEventPage = ({ orgSlug, orgName, orgOwnerId }: CreateEventPageProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className='p-8'>
        <Spinner />
      </div>
    );
  }

  if (!user || user.uid !== orgOwnerId) {
    return <p>Unauthorized, please sign in as the owner.</p>;
  }

  return (
    <div className='w-full flex flex-col items-center gap-8'>
      <h1 className='text-2xl font-bold max-w-full text-center'>Create Event For {orgName}</h1>
      <EventForm orgSlug={orgSlug} ownerId={orgOwnerId} />
    </div>
  );
};

export default CreateEventPage;
