'use client';

import { db } from '@/lib/firebase';
import { EventData, SignupData } from '@/types';
import { DocumentData } from 'firebase-admin/firestore';
import {
  collection,
  doc,
  FirestoreError,
  orderBy,
  query,
  WithFieldValue,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { createContext, ReactNode, useContext, useMemo } from 'react';
import { useCollectionData, useDocument } from 'react-firebase-hooks/firestore';

interface EventContextType {
  eventData: (EventData & { id: string }) | undefined;
  eventLoading: boolean;
  eventError: FirestoreError | undefined;
  signups: SignupData[] | undefined;
  signupsLoading: boolean;
  signupsError: FirestoreError | undefined;
  waitlist: SignupData[] | undefined;
  waitlistLoading: boolean;
  waitlistError: FirestoreError | undefined;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider = ({ eventId, children }: { eventId: string; children: ReactNode }) => {
  // listen to the event document in Firestore
  const [eventSnapshot, eventLoading, eventError] = useDocument(doc(db, 'events', eventId));
  const eventData = eventSnapshot
    ? { ...(eventSnapshot.data() as EventData), id: eventId }
    : undefined;

  // listen to the signups subcollection in Firestore
  const signupsRef = useMemo(
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
  const [signups, signupsLoading, signupsError] = useCollectionData<SignupData>(
    query(signupsRef, orderBy('signupTime')),
  );

  // listen to the waitlist subcollection in Firestore
  const waitlistRef = useMemo(
    () =>
      collection(db, 'events', eventId, 'waitlist').withConverter<SignupData>({
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
  const [waitlist, waitlistLoading, waitlistError] = useCollectionData<SignupData>(
    query(waitlistRef, orderBy('signupTime')),
  );

  const value = {
    eventData,
    eventLoading,
    eventError,
    signups,
    signupsLoading,
    signupsError,
    waitlist,
    waitlistLoading,
    waitlistError,
  };
  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
};

export const useEvent = () => {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
};
