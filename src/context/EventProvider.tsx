'use client';

import { db } from '@/lib/firebase';
import { EventData, PromptData, SignupData } from '@/types';
import { DocumentData } from 'firebase-admin/firestore';
import {
  collection,
  doc,
  FirestoreError,
  orderBy,
  query,
  WithFieldValue,
  QueryDocumentSnapshot,
  getDocs,
} from 'firebase/firestore';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
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
  prompts: PromptData[] | undefined;
  promptsLoading: boolean;
  promptsError: Error | undefined;
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
            id: signupData.id,
            displayName: signupData.displayName,
            signupTime: signupData.signupTime,
            email: signupData.email,
            photoURL: signupData.photoURL,
            answers: signupData.answers,
          };
        },
        fromFirestore(snapshot: QueryDocumentSnapshot): SignupData {
          const data = snapshot.data();
          return {
            id: snapshot.id,
            displayName: data.displayName,
            signupTime: data.signupTime,
            email: data.email,
            photoURL: data.photoURL,
            answers: data.answers,
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
            id: signupData.id,
            displayName: signupData.displayName,
            signupTime: signupData.signupTime,
            email: signupData.email,
            photoURL: signupData.photoURL,
            answers: signupData.answers,
          };
        },
        fromFirestore(snapshot: QueryDocumentSnapshot): SignupData {
          const data = snapshot.data();
          return {
            id: snapshot.id,
            displayName: data.displayName,
            signupTime: data.signupTime,
            email: data.email,
            photoURL: data.photoURL,
            answers: data.answers,
          };
        },
      }),
    [eventId],
  );
  const [waitlist, waitlistLoading, waitlistError] = useCollectionData<SignupData>(
    query(waitlistRef, orderBy('signupTime')),
  );

  // fetch prompts subcollection from Firestore
  const [prompts, setprompts] = useState<PromptData[] | undefined>(undefined);
  const [promptsLoading, setPromptsLoading] = useState(true);
  const [promptsError, setPromptsError] = useState<Error | undefined>(undefined);
  useEffect(() => {
    const fetchPrompts = async () => {
      setPromptsLoading(true);
      setPromptsError(undefined);
      try {
        const promptsCollectionRef = collection(db, 'events', eventId, 'prompts');
        const promptsQuery = query(promptsCollectionRef, orderBy('order'));
        const querySnapshot = await getDocs(promptsQuery);

        const prompts: PromptData[] = querySnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as PromptData,
        );

        setprompts(prompts);
      } catch (err) {
        setPromptsError(err as Error);
      } finally {
        setPromptsLoading(false);
      }
    };
    fetchPrompts();
  }, [eventId]);

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
    prompts,
    promptsLoading,
    promptsError,
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
