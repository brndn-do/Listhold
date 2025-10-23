'use client';

import { db } from '@/lib/firebase';
import { isSameDay, format } from 'date-fns';
import { doc } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';

interface EventInfoProps {
  eventId: string;
}

const EventInfo = ({ eventId }: EventInfoProps) => {
  const [snapshot, loading, error] = useDocument(doc(db, 'events', eventId));

  const formatEventTiming = () => {
    const startDate = snapshot?.data()?.start.toDate();
    const endDate = snapshot?.data()?.end.toDate();
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
      {loading && <p className='text-2xl text-center font-bold'>Loading...</p>}
      {error && (
        <p className='text-2xl text-center font-bold'>
          {' '}
          Error: {error?.message || 'unexpected error occurred'}
        </p>
      )}
      {!loading && !error && (
        <>
          <h2 className='text-2xl text-center font-bold'>{snapshot?.data()?.name}</h2>
          <p className='text-[0.8rem] text-center'>{`📅 ${formatEventTiming()}`}</p>
          <p className='text-[0.8rem] text-center'>{`📍 ${snapshot?.data()?.location}`}</p>
          <p className='text-[0.8rem] text-center'>{`Total Spots: ${snapshot?.data()?.capacity}`}</p>
        </>
      )}
    </div>
  );
};

export default EventInfo;
