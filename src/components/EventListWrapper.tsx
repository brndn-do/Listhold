'use client';

import { app } from '@/lib/firebase';
import { FunctionsError, getFunctions, httpsCallable } from 'firebase/functions';
import { useState } from 'react';
import EventButton from './EventButton';
import EventList from './EventList';
import { useEvent } from '@/context/EventProvider';

const COOLDOWN_TIME = 2500; // how long to disable button after successful join/leave
const ERROR_TIME = 5000; // how long to display error before allowing retries

const EventListWrapper = () => {
  const { eventData } = useEvent();
  const eventId = eventData?.id;

  const [cooldown, setCooldown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [functionError, setFunctionError] = useState<string | null>(null);
  const [viewWaitlist, setViewWaitlist] = useState(false); // is the user viewing waitlist or the main list?

  const handleSignup = async () => {
    setIsLoading(true);
    setFunctionError(null);
    try {
      const functions = getFunctions(app);
      const handleSignup = httpsCallable(functions, 'handleSignup');
      await handleSignup({ eventId });
      setIsLoading(false);
      setCooldown(true); // set a cooldown to make sure users can't spam for BUTTON_TIMEOUT miliseconds
      setTimeout(() => {
        setCooldown(false);
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
    setIsLoading(true);
    setFunctionError(null);
    try {
      const functions = getFunctions(app);
      const handleLeave = httpsCallable(functions, 'handleLeave');
      await handleLeave({ eventId });
      setIsLoading(false);
      setCooldown(true); // set a cooldown to make sure users can't spam for BUTTON_TIMEOUT miliseconds
      setTimeout(() => {
        setCooldown(false);
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
    <div className='w-full h-full flex flex-col items-center gap-1'>
      <div className='flex gap-24 text-lg pb-1'>
        <button
          onClick={() => setViewWaitlist(false)}
          className={`${!viewWaitlist ? 'text-purple-700 dark:text-purple-500 ' : ''}underline hover:cursor-pointer`}
        >
          Signups
        </button>
        <button
          onClick={() => setViewWaitlist(true)}
          className={`${viewWaitlist ? 'text-purple-700 dark:text-purple-500 ' : ''}underline hover:cursor-pointer`}
        >
          Waitlist
        </button>
      </div>

      <div className='relative flex flex-col items-center border h-[52dvh] w-full py-2 px-1 rounded-2xl'>
        <EventList viewWaitlist={viewWaitlist} />
      </div>

      <div className='flex flex-col items-end pt-1 px-2 w-full'>
        <EventButton
          cooldown={cooldown}
          isLoading={isLoading}
          functionError={functionError}
          handleSignup={handleSignup}
          handleLeave={handleLeave}
        />
      </div>
    </div>
  );
};

export default EventListWrapper;
