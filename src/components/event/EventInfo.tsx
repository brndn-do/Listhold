'use client';

import { formatEventTiming } from '@/utils/timeFormatter';
import Spinner from '../ui/Spinner';
import { useEvent } from '@/context/EventProvider';
import Link from 'next/link';

const EventInfo = () => {
  const { event, eventLoading, eventError } = useEvent();

  if (eventLoading) {
    return (
      <div className='flex items-center'>
        <span>
          <Spinner />
        </span>
      </div>
    );
  }
  if (eventError) {
    return (
      <p className='text-2xl text-center font-bold'>
        {' '}
        Error fetching event details: {eventError.message || 'unexpected error'}
      </p>
    );
  }
  if (event) {
    return (
      <div className='flex flex-col gap-[1px]'>
        <h1 className='text-[1.3rem] text-center font-bold'>{event.name}</h1>
        <Link
          href={`/organizations/${event.organizationId}`}
          className='text-[0.8rem] text-center font-bold text-purple-700 dark:text-purple-500 underline'
        >
          {event.organizationName} →
        </Link>
        <p className='text-[0.8rem] text-center'>{`📅 ${formatEventTiming(event.start, event.end)}`}</p>
        <p className='text-[0.8rem] text-center'>{`📍 ${event?.location}`}</p>
        <p className='text-[0.8rem] text-center font-bold text-purple-700 dark:text-purple-500'>{`Spots Left: ${event.capacity - event.signupsCount}/${event.capacity}`}</p>
      </div>
    );
  }
};

export default EventInfo;
