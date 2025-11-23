'use client';

import { formatEventTiming } from '@/utils/timeFormatter';
import Spinner from '../ui/Spinner';
import { useEvent } from '@/context/EventProvider';

const EventInfo = () => {
  const { event, eventLoading, eventError } = useEvent();
  return (
    <div className='flex flex-col items-center gap-1'>
      {eventLoading && (
        <div className='flex items-center'>
          <span>
            <Spinner />
          </span>
        </div>
      )}
      {eventError && (
        <p className='text-2xl text-center font-bold'>
          {' '}
          Error fetching event details: {eventError.message || 'unexpected error'}
        </p>
      )}
      {event && (
        <div className='flex flex-col gap-[1px]'>
          <h2 className='text-[1.3rem] text-center font-bold'>{event.name}</h2>
          <p className='text-[0.8rem] text-center'>{`📅 ${formatEventTiming(event.start, event.end)}`}</p>
          <p className='text-[0.8rem] text-center'>{`📍 ${event.location}`}</p>
          <p className='text-[0.8rem] text-center font-bold text-purple-700 dark:text-purple-500'>{`Spots Left: ${event.capacity - event.signupsCount}/${event.capacity}`}</p>
        </div>
      )}
    </div>
  );
};

export default EventInfo;
