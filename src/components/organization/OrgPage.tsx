'use client';

import CreateEventLink from '@/components/organization/CreateEventLink';
import EventsList from '@/components/organization/EventsList';
import Line from '@/components/ui/Line';
import { EventData } from '@/types/clientEventData';
import { ClientOrgData } from '@/types/clientOrgData';
import { WithId } from '@/types/withId';

interface OrgPageProps {
  orgData: ClientOrgData;
  events: WithId<EventData>[];
}

const OrgPage = ({ orgData, events }: OrgPageProps) => {
  // extract name and desc
  const { slug, name, description, ownerId } = orgData;

  return (
    <div className='w-full flex flex-col gap-4 items-center'>
      <div className='flex flex-col gap-1 items-center'>
        <h1 className='text-2xl text-center font-bold'>{name}</h1>
        {description && <p className='text-md text-center'>{description}</p>}
      </div>

      <Line />

      <div className='flex flex-col gap-2 items-center'>
        <h1 className='text-xl font-bold'>Upcoming Events:</h1>
        <CreateEventLink orgSlug={slug} ownerId={ownerId} />
        <EventsList events={events} />
      </div>
    </div>
  );
};

export default OrgPage;
