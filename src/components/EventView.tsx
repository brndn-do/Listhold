'use client';

import { db } from '@/lib/firebase';
import EventInfo from './EventInfo';
import { useCollectionData, useDocument } from 'react-firebase-hooks/firestore';
import {
  collection,
  doc,
  DocumentData,
  orderBy,
  query,
  QueryDocumentSnapshot,
  WithFieldValue,
} from 'firebase/firestore';
import { useMemo } from 'react';
import { SignupData } from '@/types';
import EventListWrapper from './EventListWrapper';

const EventView = ({ eventId }: { eventId: string }) => {
  // listen to the event document in Firestore
  const [eventSnapshot, eventLoading, eventError] = useDocument(doc(db, 'events', eventId));
  const eventData = eventSnapshot?.data();

  // listen to the signups subcollection in Firestore
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
  const [signups, signupsLoading, signupsError] = useCollectionData<SignupData>(q);

  return (
    <div className='flex flex-col items-center p-4 gap-2 h-full w-full md:w-[50%] lg:w-[40%] xl:w-[30%] 2xl:w-[25%]'>
      <EventInfo eventData={eventData} eventLoading={eventLoading} eventError={eventError} />
      <div className='border-b-1 border-dashed w-[90%]'></div> {/* separator */}
      <EventListWrapper
        eventId={eventId}
        eventData={eventData}
        eventLoading={eventLoading}
        eventError={eventError}
        signups={signups}
        signupsLoading={signupsLoading}
        signupsError={signupsError}
      />
    </div>
  );
};
export default EventView;
