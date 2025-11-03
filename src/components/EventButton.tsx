import { useAuth } from '@/context/AuthProvider';
import Spinner from './Spinner';
import { useEvent } from '@/context/EventProvider';
import { useMemo } from 'react';

interface EventButtonProps {
  functionError: string | null;
  cooldown: boolean;
  isLoading : boolean;
  handleSignup: () => void;
  handleLeave: () => void;
}

const EventButton = ({ functionError, cooldown, isLoading, handleSignup, handleLeave }: EventButtonProps) => {
  const { user } = useAuth();
  const { eventData, signups } = useEvent();

  const alreadyJoined = useMemo(() => {
    return !!(user && signups && signups?.some((s) => s.uid === user?.uid));
  }, [user, signups]);

  // are there spots open?
  const spotsOpen = useMemo(() => {
    return !!(
      signups && Number.isInteger(signups.length) && (eventData?.capacity ?? 0) > signups.length
    );
  }, [eventData, signups]);

  // if there's an error display the error instead of a button
  if (functionError) {
    return <p className='mt-2 text-sm text-red-600 self-end'>{functionError}</p>;
  }

  // must sign in first to do anything
  if (!user) {
    return (
      <button
        disabled={true}
        className='opacity-35 focus:outline-none text-sm text-white bg-purple-700 font-medium rounded-lg text-sm px-3.5 py-2 dark:bg-purple-600 dark:focus:ring-purple-900'
      >
        Sign in to join the list.
      </button>
    );
  }
  // already joined, allow leaving the event
  if (alreadyJoined) {
    return (
      <button
        onClick={handleLeave}
        disabled={isLoading || cooldown}
        className={`${isLoading || cooldown ? 'opacity-35' : 'hover:cursor-pointer'} inline-flex focus:outline-none text-sm text-white bg-purple-700 hover:bg-purple-800 font-medium rounded-lg text-sm px-3.5 py-2 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900`}
      >
        {isLoading && <Spinner />}
        {isLoading && 'Leaving...'}
        {!isLoading && cooldown && 'You joined the list!'}
        {!isLoading && !cooldown && 'Leave this event'}
      </button>
    );
  }
  // no spots, disable
  if (!spotsOpen) {
    return (
      <button
        onClick={handleSignup}
        disabled={isLoading || cooldown}
        className={`${isLoading || cooldown ? 'opacity-35' : 'hover:cursor-pointer'} inline-flex focus:outline-none text-sm text-white bg-purple-700 hover:bg-purple-800 font-medium rounded-lg text-sm px-3.5 py-2 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900`}
      >
        {isLoading && <Spinner />}
        {isLoading && 'Joining...'}
        {!isLoading && cooldown && 'You left the list.'}
        {!isLoading && !cooldown && 'Event is full - join the waitlist'}
      </button>
    );
  }
  // default (can join)
  return (
    <button
      onClick={handleSignup}
      disabled={isLoading || cooldown}
      className={`${isLoading || cooldown ? 'opacity-35' : 'hover:cursor-pointer'} inline-flex focus:outline-none text-sm text-white bg-purple-700 hover:bg-purple-800 font-medium rounded-lg text-sm px-3.5 py-2 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900`}
    >
      {isLoading && <Spinner />}
      {isLoading && 'Joining...'}
      {!isLoading && cooldown && 'You left the list.'}
      {!isLoading && !cooldown && 'Join the List'}
    </button>
  );
};

export default EventButton;
