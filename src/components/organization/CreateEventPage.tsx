'use client';

import EventForm from '@/components/organization/EventForm';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '@/context/AuthProvider';
import { OrganizationData } from '@/types/organizationData';
import { WithId } from '@/types/withId';

interface CreateEventPageProps {
  orgData: WithId<OrganizationData>;
}

const CreateEventPage = ({ orgData }: CreateEventPageProps) => {
  const { user, loading } = useAuth();

  // extract name and ownerId
  const { id: orgId, name, ownerId } = orgData;

  if (loading) {
    return (
      <div className='p-8'>
        <Spinner />
      </div>
    );
  }

  if (!user || user.uid !== ownerId) {
    return <p>Unauthorized, please sign in as the owner.</p>;
  }

  return (
    <div className='w-full flex flex-col items-center gap-8'>
      <h1 className='text-2xl font-bold max-w-full text-center'>Create Event For {name}</h1>
      <EventForm organizationId={orgId} ownerId={ownerId} />
    </div>
  );
};

export default CreateEventPage;
