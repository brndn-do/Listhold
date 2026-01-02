import CreateEventPage from '@/components/event/CreateEventPage';
import { Metadata } from 'next';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Create New Event — Listhold',
};

const CreateEvent = async () => {
  return (
    <CreateEventPage />
  );
};

export default CreateEvent;
