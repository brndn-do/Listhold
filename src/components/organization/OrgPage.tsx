'use client';

import CreateEventLink from '@/components/organization/CreateEventLink';
import EventsList from '@/components/organization/EventsList';
import { EventData } from '@/types/eventData';
import { OrganizationData } from '@/types/organizationData';
import { WithId } from '@/types/withId';

interface OrgPageProps {
  orgData: WithId<OrganizationData>;
  events: WithId<EventData>[];
}

const OrgPage = ({ orgData, events }: OrgPageProps) => {
  // extract name and desc
  const { id: orgId, name, description, ownerId } = orgData;

  return (
    <div className='w-full flex flex-col p-8 gap-4 items-center'>
      <div className='flex flex-col gap-1 items-center'>
        <h1 className='text-2xl font-bold'>{name}</h1>
        {description && <p className='text-md'>{description}</p>}
      </div>

      {/* dotted separator */}
      <div className='w-full border-b border-dotted'></div>

      <div className='flex flex-col gap-2 items-center'>
        <h1 className='text-xl font-bold'>Upcoming Events:</h1>
        <CreateEventLink organizationId={orgId} ownerId={ownerId} />
        <EventsList events={events} />
      </div>
    </div>
  );
};

export default OrgPage;
