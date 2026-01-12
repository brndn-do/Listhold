'use client';

import Loading from '@/app/loading';
import EventForm from '@/components/event/EventForm';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthProvider';
import { signInWithGoogle } from '@/services/authService';

const CreateEventPage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return (
      <div className='w-full flex flex-col items-center gap-4'>
        <h1 className='text-2xl font-bold'>Create Event</h1>
        <p className='text-gray-600 dark:text-gray-400 text-center max-w-md'>
          Sign in to create an event
        </p>
        <Button onClick={signInWithGoogle} content='Sign In With Google' />
      </div>
    );
  }

  return (
    <div className='w-full flex flex-col items-center gap-8'>
      <h1 className='text-2xl font-bold max-w-full text-center'>Create Event</h1>
      <EventForm />
    </div>
  );
};

export default CreateEventPage;
