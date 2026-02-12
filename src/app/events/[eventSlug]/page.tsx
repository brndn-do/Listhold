import NotFound from '@/app/not-found';
import EventPage from '@/components/event/EventPage';
import { EventProvider } from '@/context/EventProvider';
import { getEventBySlug } from '@/services/getEventBySlug';
import { Metadata } from 'next';
import { cache } from 'react';

export const dynamic = 'force-static';
export const revalidate = 60;

const cachedGetEventBySlug = cache(getEventBySlug);

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}): Promise<Metadata> => {
  const { eventSlug } = await params;
  try {
    const props = await cachedGetEventBySlug(eventSlug);
    if (!props) {
      return {
        title: 'Event Not Found — Listhold',
        description: 'The requested event could not be found.',
      };
    }

    return {
      title: `${props.name} — Listhold`,
      description: props.description || 'Join this event on Listhold.',
    };
  } catch (err) {
    return {
      title: 'Error — Listhold',
      description: 'There was an error fetching the event.',
    };
  }
};

const Event = async ({ params }: { params: Promise<{ eventSlug: string }> }) => {
  const { eventSlug } = await params;
  const props = await cachedGetEventBySlug(eventSlug);
  if (!props) {
    return <NotFound />;
  }
  return (
    <EventProvider {...props}>
      <EventPage />
    </EventProvider>
  );
};

export default Event;
