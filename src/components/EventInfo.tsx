'use client';

import formatEventTiming from '@/utils/formatEventTiming';
import Spinner from './Spinner';
import { useEvent } from '@/context/EventProvider';

const EventInfo = () => {
  const { eventData, eventLoading, eventError } = useEvent();
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
      {eventData && (
        <>
          <h2 className='text-2xl text-center font-bold'>{eventData.name}</h2>
          <p className='text-[0.8rem] text-center'>{`📅 ${formatEventTiming(eventData.start, eventData.end)}`}</p>
          <p className='text-[0.8rem] text-center'>{`📍 ${eventData.location}`}</p>
          <p className='text-[0.8rem] text-center font-bold text-purple-700 dark:text-purple-500'>{`Spots Left: ${eventData.capacity - eventData.signupsCount}/${eventData.capacity}`}</p>
        </>
      )}
    </div>
  );
};

export default EventInfo;
