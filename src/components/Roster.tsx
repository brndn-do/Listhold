'use client';

import { useAuth } from '@/context/AuthProvider';
import { app } from '@/lib/firebase';
import { SignupData } from '@/types';
import { DocumentData, FirestoreError } from 'firebase/firestore';
import { FunctionsError, getFunctions, httpsCallable } from 'firebase/functions';
import { useMemo, useState } from 'react';
import RosterButton from './RosterButton';
import Spinner from './Spinner';

interface RosterProps {
  eventId: string;
  eventData: DocumentData | undefined;
  eventLoading: boolean;
  eventError: FirestoreError | undefined;
  signups: SignupData[] | undefined;
  signupsLoading: boolean;
  signupsError: FirestoreError | undefined;
}

const Roster = ({ eventId, eventData, signups, signupsLoading, signupsError }: RosterProps) => {
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
      <h2 className='text-lg font-bold'>Roster:</h2>

      <div className='relative flex flex-col items-center border h-[52dvh] w-full py-2 px-1 rounded-2xl'>
        {signupsLoading && <div>{<Spinner />}</div>}
        {signupsError && <p>Error: {signupsError.message}</p>}

        {signups && (
          <div className='flex flex-col items-center w-full h-full'>
            <ol className='flex-1 flex flex-col w-full overflow-y-auto scrollbar scrollbar-thin items-center list-decimal list-inside'>
              {signups.map((signup) => (
                <li
                  className={user?.uid === signup.uid ? 'text-purple-700 dark:text-purple-600' : ''}
                  key={signup.uid}
                >{`${signup.displayName}`}</li>
              ))}
              {Array.from({ length: 15 }, (_, i) => `Hidden ${i + 1}`).map((str) => (
                <li aria-hidden='true' className='opacity-0' key={str}></li>
              ))}
            </ol>
            {/* gradient fade hint */}
            <div className='pointer-events-none absolute top-0 p-2 w-full h-[5%] bg-gradient-to-b from-[#f6f6f6ff] dark:from-[#191919] to-transparent rounded-t-2xl' />
            {/* gradient fade hint */}
            <div className='pointer-events-none absolute bottom-0 p-2 w-full h-[30%] bg-gradient-to-t from-[#f6f6f6ff] dark:from-[#191919] to-transparent rounded-b-2xl' />
          </div>
        )}
      </div>

      <div className='flex flex-col items-end pt-1 px-2 w-full'>
        <RosterButton
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

export default Roster;
