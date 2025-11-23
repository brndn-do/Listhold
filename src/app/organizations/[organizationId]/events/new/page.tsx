import EventForm from '@/components/EventForm';
import { getOrganizationById } from '@/services/server-only/organizationService';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface CreateEventPageProps {
  params: Promise<{ organizationId: string }>;
}

// Dynamic metadata for Next.js App Router
export const generateMetadata = async (): Promise<Metadata> => {
  return {
    title: `Create New Event — Rosterize`,
  };
};

const CreateEventPage = async ({ params }: CreateEventPageProps) => {
  const { organizationId } = await params;
  try {
    const org = await getOrganizationById(organizationId);

    // check if null
    if (!org) {
      return notFound();
    }

    // extract name and ownerId
    const { name, ownerId } = org;

    return (
      <div className='w-full flex flex-col items-center gap-8 px-2 py-8'>
        <h1 className='text-2xl font-bold max-w-full text-center'>Create Event For {name}</h1>
        <EventForm organizationId={organizationId} ownerId={ownerId} />
      </div>
    );
  } catch (err) {
    console.log('Error fetching organization details', err);
    throw err;
  }
};

export default CreateEventPage;
