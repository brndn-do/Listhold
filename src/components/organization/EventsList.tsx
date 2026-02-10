'use client';

import Link from 'next/link';
import { formatDate } from '@/utils/timeFormatter';
import { OrgPageEvent } from '@/components/organization/OrgPage';

interface EventsListProps {
  events: OrgPageEvent[];
}

const EventsList = ({ events }: EventsListProps) => {
  if (events.length === 0) {
    return (
      <div className='flex justify-center py-8'>
        <p className='text-gray-500'>No upcoming events</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col items-center gap-4'>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'>
        {events.map((event) => (
          <Link
            href={`/events/${encodeURI(event.slug)}`}
            key={event.slug}
            className='group flex flex-col gap-8 rounded-lg border p-3 transition-all duration-250 ease-in hover:scale-103 hover:border-purple-600 hover:text-purple-600 dark:hover:border-purple-500 dark:hover:text-purple-500'
          >
            <div className='flex flex-col gap-1'>
              <h2 className='text-md text-center font-bold'>{event.name}</h2>
              <p className='text-center text-xs'>{`📅 ${formatDate(event.start).formattedDate}`}</p>
              <p className='text-center text-xs'>{`📍 ${event.location}`}</p>
            </div>

            <p className='mt-auto self-end text-center text-xs font-medium text-purple-600 md:hidden dark:text-purple-400'>
              Tap to view →
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default EventsList;
