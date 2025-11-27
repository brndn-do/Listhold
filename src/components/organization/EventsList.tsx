'use client';

import { getEventsByOrgId } from '@/services/eventsService';
import { EventData } from '@/types/eventData';
import { WithId } from '@/types/withId';
import { formatTimestamp } from '@/utils/timeFormatter';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Spinner from '../ui/Spinner';

interface EventsListProps {
  organizationId: string;
}

const EventsList = ({ organizationId }: EventsListProps) => {
  const [events, setEvents] = useState<WithId<EventData>[] | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const result: WithId<EventData>[] = await getEventsByOrgId(organizationId);
        setEvents(result);
      } catch (err) {
        console.error('Failed to fetch events:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [organizationId]);

  if (loading) {
    return (
      <div className='flex justify-center py-8'>
        <p className='inline-flex items-center'>
          <Spinner />
          Loading events...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex justify-center py-8'>
        <p className='text-red-500'>Failed to load events. Please try again.</p>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className='flex justify-center py-8'>
        <p className='text-gray-500'>No upcoming events</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-4 items-center'>
      <div className='grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'>
        {events.map((event) => (
          <Link
            href={`/events/${encodeURI(event.id)}`}
            key={event.id}
            className='group flex flex-col gap-8 rounded-lg border p-3 transition-all duration-250 ease-in hover:scale-103 hover:border-purple-600 hover:text-purple-600 dark:hover:border-purple-500 dark:hover:text-purple-500'
          >
            <div className='flex flex-col gap-1'>
              <h2 className='text-md text-center font-bold'>{event.name}</h2>
              <p className='text-xs text-center'>{`📅 ${formatTimestamp(event.start).formattedDate}`}</p>
              <p className='text-xs text-center'>{`📍 ${event.location}`}</p>
            </div>

            <p className='md:hidden mt-auto self-end text-center text-xs font-medium text-purple-600 dark:text-purple-500'>
              Tap to view →
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default EventsList;
