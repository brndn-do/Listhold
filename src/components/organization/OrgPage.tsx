'use client';

import CreateEventLink from '@/components/organization/CreateEventLink';
import EventsList from '@/components/organization/EventsList';
import Line from '@/components/ui/Line';

export interface OrgPageEvent {
  slug: string;
  name: string;
  start: Date;
  location: string;
}

export interface OrgPageProps {
  slug: string;
  name: string;
  description?: string;
  ownerId: string;
  events: OrgPageEvent[];
}

const OrgPage = ({ slug, name, description, ownerId, events }: OrgPageProps) => {
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
