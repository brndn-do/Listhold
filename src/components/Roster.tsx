'use client';

import { db } from '@/lib/firebase';
import { SignupData } from '@/types';
import {
  collection,
  DocumentData,
  orderBy,
  query,
  WithFieldValue,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { useMemo } from 'react';
import { useCollectionData } from 'react-firebase-hooks/firestore';

interface RosterProps {
  eventId: string;
}

const Roster = ({ eventId }: RosterProps) => {
  const collectionRef = useMemo(
    () =>
      collection(db, 'events', eventId, 'signups').withConverter<SignupData>({
        toFirestore(signupData: WithFieldValue<SignupData>): DocumentData {
          return {
            uid: signupData.uid,
            displayName: signupData.displayName,
            signupTime: signupData.signupTime,
          };
        },
        fromFirestore(snapshot: QueryDocumentSnapshot): SignupData {
          const data = snapshot.data();
          return {
            uid: snapshot.id,
            displayName: data.displayName,
            signupTime: data.signupTime,
          };
        },
      }),
    [eventId],
  );

  const q = query(collectionRef, orderBy('signupTime'));

  const [signups, loading, error] = useCollectionData<SignupData>(q);

  return (
    <div className='w-full h-full flex flex-col items-center gap-2'>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      <h2 className='text-2xl font-bold'>Roster:</h2>
      <div className='flex flex-col items-center border-1 w-[70%] p-4 min-h-[50vh] rounded-4xl'>
        {signups && (
          <ul className='flex flex-col items-center w-full'>
            {signups.map((signup, i) => (
              <li key={signup.uid}>{`${i + 1}. ${signup.displayName}`}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Roster;
