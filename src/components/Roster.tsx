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
  eventLoading,
  eventError,
  signups,
  signupsLoading,
  signupsError,
}: RosterProps) => {
  const { user, loading } = useAuth();

  const alreadyJoined = useMemo(() => {
    if (!user) return false;
    return signups?.some((s) => s.uid === user.uid);
  }, [user, signups]);

  const spotsOpen = useMemo(() => {
    if (!eventData || eventLoading || eventError || !signups) return false;
    return (eventData.capacity ?? 0) > signups.length;
  }, [eventData, eventLoading, eventError, signups]);

  return (
    <div className='w-full h-full flex flex-col items-center gap-2'>
      {signupsLoading && <p>Loading...</p>}
      {signupsError && <p>Error: {signupsError.message}</p>}

      <h2 className='text-2xl font-bold'>Roster:</h2>

      <div className='flex flex-col items-center border-1 w-[100%] md:w-[50%] lg:w-[40%] xl:w-[30%] 2xl:w-[25%] p-4 min-h-[50vh] rounded-2xl'>
        {/* Display list of signups if available */}
        {signups && (
          <ul className='flex flex-col items-center w-full'>
            {signups.map((signup, i) => (
              <li key={signup.uid}>{`${i + 1}. ${signup.displayName}`}</li>
            ))}
          </ul>
        )}

        {/*Display button for joining only if user is signed in, has not joined yet, and there are spots open*/}
        {!loading && user && !signupsLoading && !signupsError && !alreadyJoined && spotsOpen && (
          <button className='self-end mt-auto focus:outline-none text-sm text-white bg-purple-700 hover:bg-purple-800 font-medium rounded-lg text-sm px-3.5 py-2 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900 hover:cursor-pointer'>
            Join the list
          </button>
        )}
        {!user && (
          <button
            aria-disabled='true'
            className='opacity-30 self-end mt-auto focus:outline-none text-sm text-white bg-purple-700 font-medium rounded-lg text-sm px-3.5 py-2 dark:bg-purple-700 dark:focus:ring-purple-900 hover:cursor-not-allowed'
          >
            Sign in to join the roster.
          </button>
        )}
        {alreadyJoined && (
          <button
            aria-disabled='true'
            className='opacity-30 self-end mt-auto focus:outline-none text-sm text-white bg-purple-700 font-medium rounded-lg text-sm px-3.5 py-2 dark:bg-purple-700 dark:focus:ring-purple-900 hover:cursor-not-allowed'
          >
            You have already joined the roster.
          </button>
        )}
        {!spotsOpen && (
          <button
            aria-disabled='true'
            className='opacity-30 self-end mt-auto focus:outline-none text-sm text-white bg-purple-700 font-medium rounded-lg text-sm px-3.5 py-2 dark:bg-purple-700 dark:focus:ring-purple-900 hover:cursor-not-allowed'
          >
            There are no spots left.
          </button>
        )}
      </div>
    </div>
  );
};

export default Roster;
