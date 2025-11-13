import EventView from '@/components/event/list/EventView';
import { EventProvider } from '@/context/EventProvider';
import { getEventNameAndDescById } from '@/services/server-only/eventNameAndDescService';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface EventPageProps {
  params: Promise<{ eventId: string }>;
}

// Dynamic metadata for Next.js App Router
export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { eventId } = await params;
  try {
    const result = await getEventNameAndDescById(eventId);

    // check if null
    if (!result) {
      console.log('event not found');
      return notFound();
    }

    // extract name and desc
    const { name, description } = result;

    return description
      ? {
          title: `${name} — Rosterize`,
          description: description,
        }
      : { title: `${name} — Rosterize` };
  } catch (err) {
    console.log('Error fetching event name and description', err);
    throw err;
  }
}

export default async function EventPage({ params }: EventPageProps) {
  const { eventId } = await params;
  return (
    <EventProvider eventId={eventId}>
      <EventView />
    </EventProvider>
  );
}
