'use client';

import { useAuth } from '@/context/AuthProvider';
import Spinner from '../ui/Spinner';
import { useEvent } from '@/context/EventProvider';
import { useMemo } from 'react';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';

interface EventButtonProps {
  cooldownMessage: string | null;
  requestLoading: boolean;
  requestError: string | null;
  handleFlowOpen: () => void;
  handleSignup: (answers: Record<string, boolean | null>) => void;
  handleLeave: () => void;
}

const EventButton = ({
  cooldownMessage,
  requestLoading,
  requestError,
  handleFlowOpen,
  handleSignup,
  handleLeave,
}: EventButtonProps) => {
  const { user } = useAuth();
  const { capacity, confirmedList, confirmedUserIds, waitlistUserIds, listLoading, fetchError, disconnected, prompts } =
    useEvent();

  // did the user already join either the signups list or the waitlist?
  const alreadyJoined: boolean = useMemo(() => {
    return !!(user && (confirmedUserIds?.has(user.uid) || waitlistUserIds?.has(user.uid)));
  }, [user, confirmedUserIds, waitlistUserIds]);

  // are there spots open on the main list?
  const spotsOpen: boolean = useMemo(() => {
    return !!((capacity ?? 0) > confirmedList.length);
  }, [capacity, confirmedList]);

  // We do not have enough information about event to allow the user to join/leave
  if (listLoading || fetchError) {
    return null;
  }

  // Disable if disconnected
  if (disconnected) {
    return null;
  }

  if (requestError) {
    // if there's an error joining/leaving display the error instead of a button
    return <ErrorMessage content={requestError} />;
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
        disabled={requestLoading || !!cooldownMessage}
        content={
          <>
            {requestLoading && <Spinner />}
            {requestLoading && 'Leaving...'}
            {!requestLoading && cooldownMessage}
            {!requestLoading && !cooldownMessage && 'Leave this event'}
          </>
        }
      />
    );
  }

  // if not already joined and no spots, allow joining the waitlist
  if (!spotsOpen) {
    return (
      <Button
        onClick={Object.keys(prompts).length === 0 ? () => handleSignup({}) : handleFlowOpen} // handleSignup expects a map of answers, so provide empty map when there are no prompts
        disabled={requestLoading || !!cooldownMessage}
        content={
          <>
            {requestLoading && <Spinner />}
            {requestLoading && 'Joining...'}
            {!requestLoading && cooldownMessage}
            {!requestLoading && !cooldownMessage && 'Event is full - join the waitlist'}
          </>
        }
      />
    );
  }

  // default (can join)
  return (
    <Button
      onClick={Object.keys(prompts).length === 0 ? () => handleSignup({}) : handleFlowOpen} // handleSignup expects a map of answers, so provide empty map when there are no prompts
      disabled={requestLoading || !!cooldownMessage}
      content={
        <>
          {requestLoading && <Spinner />}
          {requestLoading && 'Joining...'}
          {!requestLoading && cooldownMessage}
          {!requestLoading && !cooldownMessage && 'Join the List'}
        </>
      }
    />
  );
};

export default EventButton;
