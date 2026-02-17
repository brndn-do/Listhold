import CreateEventPage from '@/features/events/components/CreateEventPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create New Event — Listhold',
};

const CreateEvent = async () => {
  return <CreateEventPage />;
};

export default CreateEvent;
