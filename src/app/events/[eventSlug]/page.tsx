import EventPage from '@/components/event/EventPage';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { EventProvider } from '@/context/EventProvider';
import { getEventProviderProps } from '@/services/getEventProviderProps';
import { Metadata } from 'next';

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}): Promise<Metadata> => {
  const { eventSlug } = await params;
  try {
    const props = await getEventProviderProps(eventSlug);
    if (!props) {
      return {
        title: 'Event Not Found — Rosterize',
        description: 'The requested event could not be found.',
      };
    }

    return {
      title: `${props.name} — Rosterize`,
      description: props.description || 'Join this event on Rosterize.',
    };
  } catch (err) {
    return {
      title: 'Error — Rosterize',
      description: 'There was an error fetching the event.',
    };
  }
};

const Event = async ({ params }: { params: Promise<{ eventSlug: string }> }) => {
  const { eventSlug } = await params;
  try {
    const props = await getEventProviderProps(eventSlug);
    if (!props) {
      return <p>Not found</p>;
    }
    return (
      <EventProvider {...props}>
        <EventPage />
      </EventProvider>
    );
  } catch (err: unknown) {
    return <ErrorMessage />;
  }
};

export default Event;
