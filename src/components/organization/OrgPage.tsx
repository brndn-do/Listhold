'use client';

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

const OrgPage = ({ name, description, events }: OrgPageProps) => {
  return (
    <div className='flex w-full flex-col items-center gap-4'>
      <div className='flex flex-col items-center gap-1'>
        <h1 className='text-center text-3xl font-bold'>{name}</h1>
        {description && <p className='text-md text-center'>{description}</p>}
      </div>

      <Line />

      <div className='flex flex-col items-center gap-2'>
        <h1 className='text-xl font-bold'>Upcoming Events:</h1>
        <EventsList events={events} />
      </div>
    </div>
  );
};

export default OrgPage;
