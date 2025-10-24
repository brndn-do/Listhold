'use client';

import { useAuth } from '@/context/AuthProvider';
import { SignupData } from '@/types';
import { DocumentData, FirestoreError } from 'firebase/firestore';
import { useMemo } from 'react';

interface RosterProps {
  eventData: DocumentData | undefined;
  eventLoading: boolean;
  eventError: FirestoreError | undefined;
  signups: SignupData[] | undefined;
  signupsLoading: boolean;
  signupsError: FirestoreError | undefined;
}

const Roster = ({
  eventData,
  signups,
  signupsLoading,
  signupsError,
}: RosterProps) => {
  const { user } = useAuth();

  // has the user already joined the list? (must be signed in first, if this is true, user is true)
  const alreadyJoined = useMemo(() => {
    return user && signups && signups?.some((s) => s.uid === user?.uid);
  }, [user, signups]);

  // are there spots open?
  const spotsOpen = useMemo(() => {
    return (
      signups && signups.length && (eventData?.capacity ?? 0) > signups.length
    );
  }, [eventData, signups]);

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
            aria-disabled='true'
            className='opacity-30 self-end mt-auto focus:outline-none text-sm text-white bg-purple-700 font-medium rounded-lg text-sm px-3.5 py-2 dark:bg-purple-700 dark:focus:ring-purple-900 hover:cursor-not-allowed'
          >
            You have already joined the list.
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
          <button className='self-end mt-auto focus:outline-none text-sm text-white bg-purple-700 hover:bg-purple-800 font-medium rounded-lg text-sm px-3.5 py-2 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900 hover:cursor-pointer'>
            Join the list
          </button>
        )}
      </div>
    </div>
  );
};

export default Roster;
