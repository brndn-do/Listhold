'use client';

import Link from 'next/link';
import SpotsCounter from '@/components/event/SpotsCounter';
import EventTime from '@/components/event/EventTime';
import { useEvent } from '@/context/EventProvider';

const EventInfo = () => {
  const { name, orgSlug, orgName, start, end, location, capacity } = useEvent();

  return (
    <div className='flex flex-col items-center gap-[1px]'>
      <h1 className='text-xl text-center font-bold'>{name}</h1>
      <Link
        href={`/organizations/${orgSlug}`}
        className='pb-1 text-sm text-center font-bold text-purple-700 dark:text-purple-500 underline'
      >
        {orgName} →
      </Link>
      <EventTime start={start} end={end} />
      <p className='text-[0.8rem] text-center'>{`📍 ${location}`}</p>
      <SpotsCounter capacity={capacity} />
    </div>
  );
};

export default EventInfo;
