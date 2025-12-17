'use client';

import EventInfo from './EventInfo';
import { useAuth } from '@/context/AuthProvider';
import { useEvent } from '@/context/EventProvider';
import { useState } from 'react';
import EventList from '@/components/event/list/EventList';
import EventButton from '@/components/event/EventButton';
import SignupFlow from '@/components/event/signup/SignupFlow';
import Line from '@/components/ui/Line';
import { addUserToEvent } from '@/services/addUserToEvent';
import { removeUserFromEvent } from '@/services/TODO/removeUserFromEvent';

const COOLDOWN_TIME = 2500; // how long to disable button after successful join/leave
const ERROR_TIME = 5000; // how long to display error before allowing retries

const EventPage = () => {
  const { user } = useAuth();
  const { eventId } = useEvent();
  const userId = user?.uid;

  const [cooldownMessage, setCooldownMessage] = useState<string | null>(null);
  const [requestLoading, setRequestLoading] = useState(false); // whether the request to join/leave is loading
  const [requestError, setRequestError] = useState<string | null>(null); // whether the request to join/leave errored
  const [viewingWaitlist, setViewingWaitlist] = useState(false); // is the user viewing waitlist or the main list?
  const [showFlow, setShowFlow] = useState(false); // whether to display the sign-up wizard/flow

  const handleFlowOpen = () => {
    setShowFlow(true);
  };

  const handleFlowClose = (answers: Record<string, boolean | null>) => {
    setShowFlow(false);
    handleSignup(answers);
  };

  const handleSignup = async (answers: Record<string, boolean | null>) => {
    if (!eventId || !userId) {
      return;
    }
    setRequestLoading(true);
    try {
      const res = await addUserToEvent(eventId, userId, answers);
      // set a cooldown to make sure users can't spam
      setCooldownMessage(res === 'confirmed' ? "You're on the list!" : "You're on the waitlist!");
      setTimeout(() => {
        setCooldownMessage(null);
      }, COOLDOWN_TIME);
    } catch (err: unknown) {
      setRequestError('An unexpected error occured. Try again in a bit.');
      setTimeout(() => {
        setRequestError(null);
      }, ERROR_TIME);
    } finally {
      setRequestLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!eventId || !userId) {
      return;
    }
    setRequestLoading(true);
    try {
      const res = await removeUserFromEvent(eventId, userId);
      // set a cooldown to make sure users can't spam
      setCooldownMessage(
        res === 'removedFromEvent' ? 'You left the list.' : 'You left the waitlist.',
      );
      setTimeout(() => {
        setCooldownMessage(null);
      }, COOLDOWN_TIME);
    } catch (err: unknown) {
      setRequestError('An unexpected error occured. Try again in a bit.');
      setTimeout(() => {
        setRequestError(null);
      }, ERROR_TIME);
    } finally {
      setRequestLoading(false);
    }
  };

  return (
    <div className='flex flex-col gap-1 items-center w-full md:w-[50%] lg:w-[40%] xl:w-[30%] 2xl:w-[25%]'>
      <EventInfo />

      <Line style='dashed' />

      <div className='w-full h-full flex flex-col items-center gap-1'>
        <div className='flex gap-24 text-lg pb-1'>
          <button
            onClick={() => setViewingWaitlist(false)}
            className={`${!viewingWaitlist ? 'text-purple-700 dark:text-purple-500 ' : ''}underline hover:cursor-pointer`}
          >
            Signups
          </button>
          <button
            onClick={() => setViewingWaitlist(true)}
            className={`${viewingWaitlist ? 'text-purple-700 dark:text-purple-500 ' : ''}underline hover:cursor-pointer`}
          >
            Waitlist
          </button>
        </div>

        <EventList viewingWaitlist={viewingWaitlist} />

        <div className='flex flex-col items-end pt-1 px-2 w-full'>
          <EventButton
            cooldownMessage={cooldownMessage}
            requestLoading={requestLoading}
            requestError={requestError}
            handleFlowOpen={handleFlowOpen}
            handleSignup={handleSignup}
            handleLeave={handleLeave}
          />
        </div>
      </div>

      {/* Dialog for sign-up flow */}
      {showFlow && <SignupFlow handleFlowClose={handleFlowClose} />}
    </div>
  );
};
export default EventPage;
