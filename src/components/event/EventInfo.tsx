'use client';

import Link from 'next/link';
import { WithId } from '@/types/withId';
import { EventData } from '@/types/eventData';
import SpotsCounter from '@/components/event/SpotsCounter';
import EventTime from '@/components/event/EventTime';

interface EventInfoProps {
  eventData: WithId<EventData>;
}

const EventInfo = ({ eventData }: EventInfoProps) => {
  return (
    <div className='flex flex-col items-center gap-[1px]'>
      <h1 className='text-[1.3rem] text-center font-bold'>{eventData.name}</h1>
      <Link
        href={`/organizations/${eventData.organizationId}`}
        className='text-[0.8rem] text-center font-bold text-purple-700 dark:text-purple-500 underline'
      >
        {eventData.organizationName} →
      </Link>
      <EventTime start={eventData.start} end={eventData.end} />
      <p className='text-[0.8rem] text-center'>{`📍 ${eventData?.location}`}</p>
      <SpotsCounter capacity={eventData.capacity} />
    </div>
  );
};

export default EventInfo;
