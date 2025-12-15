import EventPage from '@/components/event/EventPage';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { EventProvider } from '@/context/EventProvider';
import { getEventBySlug } from '@/services/getEventBySlug';
import { getPromptsByEventId } from '@/services/TODO/getPromptsByEventId';
import { EventData } from '@/types/clientEventData';
import { PromptData } from '@/types/promptData';
import { WithId } from '@/types/withId';
import { Metadata } from 'next';

export const revalidate = 60;

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}): Promise<Metadata> => {
  const { eventSlug } = await params;
  try {
    const eventData: WithId<EventData> | null = await getEventBySlug(eventSlug);
    if (!eventData) {
      return {
        title: 'Event Not Found — Rosterize',
        description: 'The requested event could not be found.',
      };
    }

    return {
      title: `${eventData.name} — Rosterize`,
      description: eventData.description || 'Join this event on Rosterize.',
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
    const eventData: WithId<EventData> | null = await getEventBySlug(eventSlug);
    if (!eventData) {
      return <p>Not found</p>;
    }
    const prompts: Record<string, PromptData> = await getPromptsByEventId(eventSlug);
    return (
      <EventProvider eventData={eventData} prompts={prompts}>
        <EventPage />
      </EventProvider>
    );
  } catch (err: unknown) {
    return <ErrorMessage />;
  }
};

export default Event;
