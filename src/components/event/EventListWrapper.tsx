'use client';

import { functions } from '@/lib/firebase';
import { FunctionsError, httpsCallable } from 'firebase/functions';
import { useEffect, useState } from 'react';
import EventButton from './EventButton';
import EventList from './list/EventList';
import { useEvent } from '@/context/EventProvider';
import { useAuth } from '@/context/AuthProvider';
import SignupFlow from './signup/SignupFlow';

interface AddUserResult {
  status: 'signedUp' | 'waitlisted';
  message: string;
}

interface RemoveUserResult {
  status: 'leftEvent' | 'leftWaitlist';
  message: string;
  promotedUserId?: string;
}

const COOLDOWN_TIME = 2500; // how long to disable button after successful join/leave
const ERROR_TIME = 5000; // how long to display error before allowing retries

const addUserToEvent = httpsCallable<
  {
    warmup: boolean;
    eventId: string;
    userId: string;
    answers: Record<string, boolean | null>;
  },
  AddUserResult
>(functions, 'addUserToEvent');

const removeUserFromEvent = httpsCallable<
  { warmup: boolean; eventId: string; userId: string },
  RemoveUserResult
>(functions, 'removeUserFromEvent');

const EventListWrapper = () => {
  const { user } = useAuth();
  const { event } = useEvent();
  const userId = user?.uid;
  const eventId = event?.id;

  const [cooldown, setCooldown] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [functionError, setFunctionError] = useState<string | null>(null);
  const [viewingWaitlist, setViewingWaitlist] = useState(false); // is the user viewing waitlist or the main list?
  const [showFlow, setShowFlow] = useState(false);

  const [hasWarmedUp, setHasWarmedUp] = useState(false);

  useEffect(() => {
    // warmup cloud functions to reduce cold start
    if (!hasWarmedUp && user && event) {
      console.log('Warming up cloud functions...');
      addUserToEvent({ warmup: true, eventId: event.id, userId: user.uid, answers: {} });
      removeUserFromEvent({ warmup: true, eventId: event.id, userId: user.uid });
      setHasWarmedUp(true);
    }
  }, [event, user, hasWarmedUp]);

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
    setIsLoading(true);
    setFunctionError(null);
    try {
      const res = await addUserToEvent({ warmup: false, eventId, userId, answers });
      setIsLoading(false);
      setCooldown(
        res.data.status === 'signedUp'
          ? 'You joined the list!'
          : res.data.status === 'waitlisted'
            ? 'You joined the waitlist!'
            : 'Success',
      ); // set a cooldown to make sure users can't spam for BUTTON_TIMEOUT ms
      setTimeout(() => {
        setCooldown(null);
      }, COOLDOWN_TIME);
    } catch (err) {
      setIsLoading(false);
      const firebaseError = err as FunctionsError;
      console.error('Firebase functions Error:', firebaseError.message);
      console.log(firebaseError.code);
      if (firebaseError.code.includes('resource-exhausted')) {
        setFunctionError('This event is already full');
      } else {
        setFunctionError('An unexpected error occured. Try again in a bit.');
      }
      setTimeout(() => {
        setFunctionError(null);
      }, ERROR_TIME);
    }
  };

  const handleLeave = async () => {
    if (!eventId || !userId) {
      return;
    }
    setIsLoading(true);
    setFunctionError(null);
    try {
      const res = await removeUserFromEvent({ warmup: false, eventId, userId });
      setIsLoading(false);
      setCooldown(
        res.data.status === 'leftEvent'
          ? 'You left the list.'
          : res.data.status === 'leftWaitlist'
            ? 'You left the waitlist.'
            : 'Success',
      ); // set a cooldown to make sure users can't spam for BUTTON_TIMEOUT ms
      setTimeout(() => {
        setCooldown(null);
      }, COOLDOWN_TIME);
    } catch (err) {
      setIsLoading(false);
      const firebaseError = err as Error;
      console.error('Firebase functions Error:', firebaseError.message);
      setFunctionError('An unexpected error occured. Try again in a bit.');
      setTimeout(() => {
        setFunctionError(null);
      }, ERROR_TIME);
    }
  };

  return (
    <>
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

        <div className='relative flex flex-col items-center border border-gray-500 h-90 w-full py-2 px-1 rounded-2xl'>
          <EventList viewingWaitlist={viewingWaitlist} />
        </div>

        <div className='flex flex-col items-end pt-1 px-2 w-full'>
          <EventButton
            cooldown={cooldown}
            isLoading={isLoading}
            functionError={functionError}
            handleFlowOpen={handleFlowOpen}
            handleSignup={handleSignup}
            handleLeave={handleLeave}
          />
        </div>
      </div>
      {showFlow && <SignupFlow handleFlowClose={handleFlowClose} />}
    </>
  );
};

export default EventListWrapper;
