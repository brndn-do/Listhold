'use client';

import { useAuth } from '@/context/AuthProvider';
import Spinner from '../ui/Spinner';
import { useEvent } from '@/context/EventProvider';
import { useMemo } from 'react';
import Button from '@/components/ui/Button';

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
      user &&
      (signups?.some((s) => s.id === user.uid) || waitlist?.some((s) => s.id === user.uid))
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
    return <Button disabled={true} content='Sign in to join the list.' />;
  }

  // already joined the selection (main list or waitlist), allow leaving it
  if (alreadyJoined) {
    return (
      <Button
        onClick={handleLeave}
        disabled={isLoading || !!cooldown}
        content={
          <>
            {isLoading && <Spinner />}
            {isLoading && 'Leaving...'}
            {!isLoading && cooldown}
            {!isLoading && !cooldown && 'Leave this event'}
          </>
        }
      />
    );
  }

  // if not already joined and no spots, allow joining the waitlist
  if (!spotsOpen) {
    return (
      <Button
        onClick={prompts?.length === 0 ? () => handleSignup({}) : handleFlowOpen} // handleSignup expects a map of answers, so provide empty map when there are no prompts
        disabled={isLoading || !!cooldown}
        content={
          <>
            {isLoading && <Spinner />}
            {isLoading && 'Joining...'}
            {!isLoading && cooldown}
            {!isLoading && !cooldown && 'Event is full - join the waitlist'}
          </>
        }
      />
    );
  }

  // default (can join)
  return (
    <Button
      onClick={prompts?.length === 0 ? () => handleSignup({}) : handleFlowOpen} // handleSignup expects a map of answers, so provide empty map when there are no prompts
      disabled={isLoading || !!cooldown}
      content={
        <>
          {isLoading && <Spinner />}
          {isLoading && 'Joining...'}
          {!isLoading && cooldown}
          {!isLoading && !cooldown && 'Join the List'}
        </>
      }
    />
  );
};

export default EventButton;
