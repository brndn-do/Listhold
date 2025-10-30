'use client';

import formatEventTiming from '@/utils/formatEventTiming';
import { DocumentData, FirestoreError } from 'firebase/firestore';

interface EventInfoProps {
  eventData: DocumentData | undefined;
  eventLoading: boolean;
  eventError: FirestoreError | undefined;
}

const EventInfo = ({ eventData, eventLoading, eventError }: EventInfoProps) => {
  return (
    <div className='flex flex-col items-center gap-1'>
      {eventLoading && <p className='text-2xl text-center font-bold'>Loading...</p>}
      {eventError && (
        <p className='text-2xl text-center font-bold'>
          {' '}
          Error: {eventError.message || 'unexpected error occurred'}
        </p>
      )}
      {eventData && (
        <>
          <h2 className='text-2xl text-center font-bold'>{eventData.name}</h2>
          <p className='text-[0.8rem] text-center'>{`📅 ${formatEventTiming(eventData.start, eventData.end)}`}</p>
          <p className='text-[0.8rem] text-center'>{`📍 ${eventData.location}`}</p>
          <p className='text-[0.8rem] text-center'>{`Total Spots: ${eventData.capacity}`}</p>
        </>
      )}
    </div>
  );
};

export default EventInfo;
