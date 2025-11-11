'use client';

import { useAuth } from '@/context/AuthProvider';
import Spinner from './Spinner';
import { useEvent } from '@/context/EventProvider';
import { useMemo } from 'react';

interface EventButtonProps {
  functionError: string | null;
  cooldown: string | null;
  isLoading: boolean;
  handleFlowOpen: () => void;
  handleSignup: (answers: Record<string, boolean | null>) => void;
  handleLeave: () => void;
}

const EventButton = ({
  functionError,
  cooldown,
  isLoading,
  handleFlowOpen,
  handleSignup,
  handleLeave,
}: EventButtonProps) => {
  const { user } = useAuth();
  const {
    eventData,
    eventLoading,
    eventError,
    signups,
    signupsLoading,
    signupsError,
    waitlist,
    waitlistLoading,
    waitlistError,
    prompts,
    promptsLoading,
    promptsError,
  } = useEvent();

  // did the user already join either the signups list or the waitlist)
  const alreadyJoined: boolean = useMemo(() => {
    return !!(
      user && signups?.some((s) => s.id === user?.uid || waitlist?.some((s) => s.id === user.uid))
    );
  }, [user, signups, waitlist]);

  // are there spots open on the main list?
  const spotsOpen: boolean = useMemo(() => {
    return !!((eventData?.capacity ?? 0) > (eventData?.signupsCount ?? 0));
  }, [eventData]);

  // We do not have enough information about event to allow the user to join/leave
  if (
    eventLoading ||
    eventError ||
    signupsLoading ||
    signupsError ||
    waitlistLoading ||
    waitlistError ||
    promptsLoading ||
    promptsError
  ) {
    return null;
  }

  if (functionError) {
    // if there's an error joining/leaving display the error instead of a button
    return <p className='mt-2 text-sm text-red-600 self-end'>{functionError}</p>;
  }

  // must sign in first to do anything
  if (!user) {
    return (
      <button
        disabled={true}
        className='opacity-35 text-sm text-white bg-purple-700 font-medium rounded-lg text-sm px-3.5 py-2 dark:bg-purple-600 dark:focus:ring-purple-900'
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
        disabled={isLoading || !!cooldown}
        className={`${isLoading || cooldown ? 'opacity-35' : 'hover:cursor-pointer'} inline-flex text-sm text-white bg-purple-700 hover:bg-purple-800 font-medium rounded-lg text-sm px-3.5 py-2 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900`}
      >
        {isLoading && <Spinner />}
        {isLoading && 'Leaving...'}
        {!isLoading && cooldown}
        {!isLoading && !cooldown && 'Leave this event'}
      </button>
    );
  }

  // if not already joined and no spots, allow joining the waitlist
  if (!spotsOpen) {
    return (
      <button
        onClick={prompts?.length === 0 ? (() => handleSignup({})) : handleFlowOpen} // handleSignup expects a map of answers, so provide empty map when there are no prompts
        disabled={isLoading || !!cooldown}
        className={`${isLoading || cooldown ? 'opacity-35' : 'hover:cursor-pointer'} inline-flex text-sm text-white bg-purple-700 hover:bg-purple-800 font-medium rounded-lg text-sm px-3.5 py-2 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900`}
      >
        {isLoading && <Spinner />}
        {isLoading && 'Joining...'}
        {!isLoading && cooldown}
        {!isLoading && !cooldown && 'Event is full - join the waitlist'}
      </button>
    );
  }

  // default (can join)
  return (
    <button
      onClick={prompts?.length === 0 ? (() => handleSignup({})) : handleFlowOpen} // handleSignup expects a map of answers, so provide empty map when there are no prompts
      disabled={isLoading || !!cooldown}
      className={`${isLoading || cooldown ? 'opacity-35' : 'hover:cursor-pointer'} inline-flex text-sm text-white bg-purple-700 hover:bg-purple-800 font-medium rounded-lg text-sm px-3.5 py-2 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900`}
    >
      {isLoading && <Spinner />}
      {isLoading && 'Joining...'}
      {!isLoading && cooldown}
      {!isLoading && !cooldown && 'Join the List'}
    </button>
  );
};

export default EventButton;
