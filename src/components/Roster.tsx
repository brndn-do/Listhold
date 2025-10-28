'use client';

import { useAuth } from '@/context/AuthProvider';
import { app } from '@/lib/firebase';
import { SignupData } from '@/types';
import { DocumentData, FirestoreError } from 'firebase/firestore';
import { FunctionsError, getFunctions, httpsCallable } from 'firebase/functions';
import { useMemo, useState } from 'react';

const Spinner = () => (
  <svg
    className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
    xmlns='http://www.w3.org/2000/svg'
    fill='none'
    viewBox='0 0 24 24'
  >
    <circle
      className='opacity-25'
      cx='12'
      cy='12'
      r='10'
      stroke='currentColor'
      strokeWidth='4'
    ></circle>
    <path
      className='opacity-75'
      fill='currentColor'
      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2
      5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
    ></path>
  </svg>
);

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

  const [isLoading, setIsLoading] = useState(false);
  const [functionError, setFunctionError] = useState<string | null>(null);

  const handleSignup = async () => {
    setIsLoading(true);
    try {
      const functions = getFunctions(app);
      const handleSignup = httpsCallable(functions, 'handleSignup');
      await handleSignup({ eventId });
    } catch (err) {
      const firebaseError = err as FunctionsError;
      console.error('Firebase functions Error:', firebaseError.message);
      switch (firebaseError.code) {
        case 'resource-exhausted':
          setFunctionError('This event is already full');
          break;
        default:
          setFunctionError('An unexpected error occured.');
          break;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeave = async () => {
    setIsLoading(true);
    try {
      const functions = getFunctions(app);
      const handleLeave = httpsCallable(functions, 'handleLeave');
      await handleLeave({ eventId });
    } catch (err) {
      const firebaseError = err as Error;
      console.error('Firebase functions Error:', firebaseError.message);
      setFunctionError('An unexpected error occured');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='w-full h-full flex flex-col items-center gap-2'>
      <h2 className='text-2xl font-bold'>Roster:</h2>

      <div className='flex flex-col items-center border-1 w-[100%] md:w-[50%] lg:w-[40%] xl:w-[30%] 2xl:w-[25%] p-4 min-h-[50vh] rounded-2xl'>
        {signupsLoading && <p>Loading...</p>}
        {signupsError && <p>Error: {signupsError.message}</p>}

        {signups && (
          <ul className='flex flex-col items-center w-full'>
            {signups.map((signup, i) => (
              <li key={signup.uid}>{`${i + 1}. ${signup.displayName}`}</li>
            ))}
          </ul>
        )}

        {signups && !user && (
          <button
            aria-disabled='true'
            className='opacity-30 self-end mt-auto focus:outline-none text-sm text-white bg-purple-700 font-medium rounded-lg text-sm px-3.5 py-2 dark:bg-purple-700 dark:focus:ring-purple-900 hover:cursor-not-allowed'
          >
            Sign in to join the list.
          </button>
        )}

        {signups && alreadyJoined && (
          <button
            onClick={handleLeave}
            disabled={isLoading}
            className='inline-flex self-end mt-auto focus:outline-none text-sm text-white bg-purple-700 hover:bg-purple-800 font-medium rounded-lg text-sm px-3.5 py-2 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900 hover:cursor-pointer'
          >
            Leave This Event
          </button>
        )}

        {signups && user && !alreadyJoined && !spotsOpen && (
          <button
            aria-disabled='true'
            className='opacity-30 self-end mt-auto focus:outline-none text-sm text-white bg-purple-700 font-medium rounded-lg text-sm px-3.5 py-2 dark:bg-purple-700 dark:focus:ring-purple-900 hover:cursor-not-allowed'
          >
            There are no spots left.
          </button>
        )}

        {signups && user && !alreadyJoined && spotsOpen && (
          <button
            onClick={handleSignup}
            disabled={isLoading}
            className='inline-flex self-end mt-auto focus:outline-none text-sm text-white bg-purple-700 hover:bg-purple-800 font-medium rounded-lg text-sm px-3.5 py-2 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900 hover:cursor-pointer'
          >
            {isLoading && <Spinner />}
            {isLoading ? 'Joining...' : 'Join the List'}
          </button>
        )}

        {functionError && <p className='mt-2 text-sm text-red-600 self-end'>{functionError}</p>}
      </div>
    </div>
  );
};

export default Roster;
