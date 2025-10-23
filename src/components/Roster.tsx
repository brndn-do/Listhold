'use client';

import { SignupData } from '@/types';
import { FirestoreError } from 'firebase/firestore';

interface RosterProps {
  signups: SignupData[] | undefined;
  signupsLoading: boolean;
  signupsError: FirestoreError | undefined;
}

const Roster = ({ signups, signupsLoading, signupsError }: RosterProps) => {
  return (
    <div className='w-full h-full flex flex-col items-center gap-2'>
      {signupsLoading && <p>Loading...</p>}
      {signupsError && <p>Error: {signupsError.message}</p>}
      <h2 className='text-2xl font-bold'>Roster:</h2>
      <div className='flex flex-col items-center border-1 w-[70%] p-4 min-h-[50vh] rounded-2xl'>
        {signups && (
          <ul className='flex flex-col items-center w-full'>
            {signups.map((signup, i) => (
              <li key={signup.uid}>{`${i + 1}. ${signup.displayName}`}</li>
            ))}
          </ul>
        )}
        <button className='self-end mt-auto focus:outline-none text-sm text-white bg-purple-700 hover:bg-purple-800 font-medium rounded-lg text-sm px-3.5 py-2 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900 hover:cursor-pointer'>
          Join the list
        </button>
      </div>
    </div>
  );
};

export default Roster;
