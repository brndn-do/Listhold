import CreateEventLink from '@/components/organization/CreateEventLink';
import EventsList from '@/components/organization/EventsList';
import { getOrganizationById, getOwnerNameById } from '@/services/server-only/organizationService';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface OrganizationPageProps {
  params: Promise<{ organizationId: string }>;
}

// Dynamic metadata for Next.js App Router
export const generateMetadata = async ({ params }: OrganizationPageProps): Promise<Metadata> => {
  const { organizationId } = await params;
  try {
    const result = await getOrganizationById(organizationId);

    // check if null
    if (!result) {
      return notFound();
    }

    // extract name and desc
    const { name, description } = result;

    return description
      ? {
          title: `${name} — Rosterize`,
          description: description,
        }
      : { title: `${name} — Rosterize` };
  } catch (err) {
    console.log('Error fetching organization name and description', err);
    throw err;
  }
};

const OrganizationPage = async ({ params }: OrganizationPageProps) => {
  const { organizationId } = await params;
  try {
    const org = await getOrganizationById(organizationId);

    // check if null
    if (!org) {
      return notFound();
    }

    // extract name and desc
    const { name, description, ownerId } = org;

    const ownerName = await getOwnerNameById(ownerId);

    return (
      <div className='w-full flex flex-col p-8 gap-4 items-center'>
        <div className='flex flex-col gap-1 items-center'>
          <h1 className='text-2xl font-bold'>{name}</h1>
          {description && <p className='text-md'>{description}</p>}
          <p className='mt-2 text-sm opacity-50'>Owner: {ownerName}</p>
        </div>

        {/* dotted separator */}
        <div className='w-full border-b border-dotted'></div>

        <div className='flex flex-col gap-2 items-center'>
          <h1 className='text-xl font-bold'>Upcoming Events:</h1>
          <CreateEventLink organizationId={organizationId} ownerId={ownerId} />
          <EventsList organizationId={organizationId} />
        </div>
      </div>
    );
  } catch (err) {
    console.log('Error fetching organization name and description', err);
    throw err;
  }
};

export default OrganizationPage;
