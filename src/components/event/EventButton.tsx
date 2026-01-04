'use client';

import { useAuth } from '@/context/AuthProvider';
import { useEvent } from '@/context/EventProvider';
import { useMemo } from 'react';
import Button from '@/components/ui/Button';

interface EventButtonProps {
  disabled?: boolean;
  handleFlowOpen: () => void;
  handleSignup: (answers: Record<string, boolean | null>) => void;
  handleLeave: () => void;
}

const EventButton = ({
  disabled = false,
  handleFlowOpen,
  handleSignup,
  handleLeave,
}: EventButtonProps) => {
  const { user } = useAuth();
  const { capacity, confirmedList, confirmedUserIds, waitlistUserIds, prompts } = useEvent();

  // did the user already join either the signups list or the waitlist?
  const alreadyJoined: boolean = useMemo(() => {
    return !!(user && (confirmedUserIds?.has(user.uid) || waitlistUserIds?.has(user.uid)));
  }, [user, confirmedUserIds, waitlistUserIds]);

  // are there spots open on the main list?
  const spotsOpen: boolean = useMemo(() => {
    return !!((capacity ?? 0) > confirmedList.length);
  }, [capacity, confirmedList]);

  // must sign in first to do anything
  if (!user) {
    return <Button disabled={true} content='Sign in to join the event.' />;
  }

  // already joined the selection (main list or waitlist), allow leaving it
  if (alreadyJoined) {
    return <Button disabled={disabled} onClick={handleLeave} content={'Leave this event'} />;
  }

  // if not already joined and no spots, allow joining the waitlist
  if (!spotsOpen) {
    return (
      <Button
        disabled={disabled}
        onClick={Object.keys(prompts).length === 0 ? () => handleSignup({}) : handleFlowOpen} // handleSignup expects a map of answers, so provide empty map when there are no prompts
        content={'Event is full - join the waitlist'}
      />
    );
  }

  // default (can join)
  return (
    <Button
      disabled={disabled}
      onClick={Object.keys(prompts).length === 0 ? () => handleSignup({}) : handleFlowOpen} // handleSignup expects a map of answers, so provide empty map when there are no prompts
      content={'Sign up for event'}
    />
  );
};

export default EventButton;
