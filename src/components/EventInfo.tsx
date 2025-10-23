'use client';

import { isSameDay, format } from 'date-fns';
import { DocumentData, FirestoreError } from 'firebase/firestore';

interface EventInfoProps {
  eventData: DocumentData | undefined;
  eventLoading: boolean;
  eventError: FirestoreError | undefined;
}

const EventInfo = ({ eventData, eventLoading, eventError }: EventInfoProps) => {
  const formatEventTiming = () => {
    const startDate = eventData?.start.toDate();
    const endDate = eventData?.end.toDate();
    if (isSameDay(startDate, endDate)) {
      // Format for a single-day event
      // "12/01/2025, 7:00 PM - 9:30 PM"
      const formattedDate = format(startDate, 'MM/dd/yyyy');
      const formattedStartTime = format(startDate, 'h:mm a');
      const formattedEndTime = format(endDate, 'h:mm a');
      return `${formattedDate}, ${formattedStartTime} - ${formattedEndTime}`;
    } else {
      // Format for a multi-day event
      // "12/01/2025 7:00 PM to 12/02/2025 9:30 PM"
      const dateTimeFormat = 'MM/dd/yyyy h:mm a';
      const formattedStart = format(startDate, dateTimeFormat);
      const formattedEnd = format(endDate, dateTimeFormat);
      return `${formattedStart} to ${formattedEnd}`;
    }
  };

  return (
    <div className='flex flex-col items-center gap-1'>
      {eventLoading && <p className='text-2xl text-center font-bold'>Loading...</p>}
      {eventError && (
        <p className='text-2xl text-center font-bold'>
          {' '}
          Error: {eventError?.message || 'unexpected error occurred'}
        </p>
      )}
      {!eventLoading && !eventError && (
        <>
          <h2 className='text-2xl text-center font-bold'>{eventData?.name}</h2>
          <p className='text-[0.8rem] text-center'>{`📅 ${formatEventTiming()}`}</p>
          <p className='text-[0.8rem] text-center'>{`📍 ${eventData?.location}`}</p>
          <p className='text-[0.8rem] text-center'>{`Total Spots: ${eventData?.capacity}`}</p>
        </>
      )}
    </div>
  );
};

export default EventInfo;
