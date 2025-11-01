'use client';

import { useAuth } from '@/context/AuthProvider';
import { app } from '@/lib/firebase';
import { SignupData } from '@/types';
import { DocumentData, FirestoreError } from 'firebase/firestore';
import { FunctionsError, getFunctions, httpsCallable } from 'firebase/functions';
import { useMemo, useState } from 'react';
import EventButton from './EventButton';
import Spinner from './Spinner';
import EventList from './EventList';

interface EventListWrapperProps {
  eventId: string;
  eventData: DocumentData | undefined;
  eventLoading: boolean;
  eventError: FirestoreError | undefined;
  signups: SignupData[] | undefined;
  signupsLoading: boolean;
  signupsError: FirestoreError | undefined;
}

const EventListWrapper = ({
  eventId,
  eventData,
  signups,
  signupsLoading,
  signupsError,
}: EventListWrapperProps) => {
  const { user } = useAuth();

  // has the user already joined the list? (must be signed in first, if this is true, user is true)
  const alreadyJoined = useMemo(() => {
    return user && signups && signups?.some((s) => s.uid === user?.uid);
  }, [user, signups]);

  // are there spots open?
  const spotsOpen = useMemo(() => {
    return (
      signups && Number.isInteger(signups.length) && (eventData?.capacity ?? 0) > signups.length
    );
  }, [eventData, signups]);

  const [cooldown, setCooldown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [functionError, setFunctionError] = useState<string | null>(null);
  const COOLDOWN_TIME = 2500; // how long to disable button after successful join/leave
  const ERROR_TIME = 7500; // how long to display error before allowing retries

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
      <div className='flex gap-24 text-lg font-[400]'>
        <button className='text-purple-700 dark:text-purple-500 underline hover:cursor-pointer'>Signups</button>
        <button className='underline hover:cursor-pointer'>Waitlist</button>
      </div>

      <div className='relative flex flex-col items-center border h-[52dvh] w-full py-2 px-1 rounded-2xl'>
        {signupsLoading && <div>{<Spinner />}</div>}
        {signupsError && <p>Error: {signupsError.message}</p>}
        {signups && <EventList signups={signups} />}
      </div>

      <div className='flex flex-col items-end pt-1 px-2 w-full'>
        <EventButton
          alreadyJoined={!!alreadyJoined}
          spotsOpen={!!spotsOpen}
          cooldown={cooldown}
          isLoading={isLoading}
          functionError={functionError}
          signups={signups}
          handleSignup={handleSignup}
          handleLeave={handleLeave}
        />
      </div>
    </div>
  );
};

export default EventListWrapper;
