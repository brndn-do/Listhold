'use client';

import { useAuth } from '@/context/AuthProvider';
import Spinner from './Spinner';
import { useEvent } from '@/context/EventProvider';
import { useMemo } from 'react';

interface EventButtonProps {
  functionError: string | null;
  cooldown: boolean;
  isLoading: boolean;
  handleSignup: () => void;
  handleLeave: () => void;
}

const EventButton = ({
  functionError,
  cooldown,
  isLoading,
  handleSignup,
  handleLeave,
}: EventButtonProps) => {
  const { user } = useAuth();
  const { eventData, signups, waitlist } = useEvent();

  // did the user already join either the signups list or the waitlist)
  const alreadyJoined: boolean = useMemo(() => {
    return !!(
      user && signups?.some((s) => s.uid === user?.uid || waitlist?.some((s) => s.uid === user.uid))
    );
  }, [user, signups, waitlist]);

  // are there spots open on the main list?
  const spotsOpen: boolean = useMemo(() => {
    return !!((eventData?.capacity ?? 0) > (eventData?.signupsCount ?? 0));
  }, [eventData]);

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

  // already joined the selection (main list or waitlist), allow leaving it
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

  // if not already joined and no spots, allow joining the waitlist
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
