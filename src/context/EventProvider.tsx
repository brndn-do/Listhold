'use client';

import { db } from '@/lib/firebase';
import { EventData, PromptData, SignupData, WithId } from '@/types';
import {
  collection,
  doc,
  FirestoreError,
  orderBy,
  query,
  getDocs,
  FirestoreDataConverter,
} from 'firebase/firestore';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { useCollection, useDocument } from 'react-firebase-hooks/firestore';

interface EventContextType {
  event: WithId<EventData> | undefined;
  eventLoading: boolean;
  eventError: FirestoreError | undefined;
  signups: WithId<SignupData>[] | undefined;
  signupIds: Set<string> | undefined; // a set with the user ID's of all people on the main list
  signupsLoading: boolean;
  signupsError: FirestoreError | undefined;
  waitlist: WithId<SignupData>[] | undefined;
  waitlistIds: Set<string> | undefined; // a set with the user ID's of all people on the waitlist
  waitlistLoading: boolean;
  waitlistError: FirestoreError | undefined;
  prompts: Record<string, PromptData> | undefined;
  promptsLoading: boolean;
  promptsError: Error | undefined;
}

function converter<T extends object>(): FirestoreDataConverter<T> {
  return {
    toFirestore(t: T) {
      return { ...t };
    },
    fromFirestore(snapshot) {
      return { ...(snapshot.data() as T) };
    },
  };
}
const eventConverter = converter<EventData>();
const signupConverter = converter<SignupData>();
const promptConverter = converter<PromptData>();

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider = ({ eventId, children }: { eventId: string; children: ReactNode }) => {
  // --- Listen to the event document in Firestore ---
  const eventRef = doc(db, 'events', eventId).withConverter(eventConverter);
  const [eventSnapshot, eventLoading, eventError] = useDocument(eventRef);
  const event: WithId<EventData> | undefined = useMemo(() => {
    return eventSnapshot
      ? { ...(eventSnapshot.data() as EventData), id: eventSnapshot.id }
      : undefined;
  }, [eventSnapshot]);

  // --- Listen to the signups subcollection in Firestore ---
  const signupsRef = collection(db, 'events', eventId, 'signups').withConverter(signupConverter);
  const [signupsSnapshot, signupsLoading, signupsError] = useCollection<SignupData>(
    query(signupsRef, orderBy('signupTime')),
  );
  // map signups
  const signups = useMemo(() => {
    return signupsSnapshot?.docs.map((doc) => {
      return {
        ...doc.data(),
        id: doc.id,
      };
    });
  }, [signupsSnapshot]);
  // create a set of ID's of all people who signed up
  const signupIds = useMemo(() => {
    return signupsSnapshot ? new Set(signupsSnapshot.docs.map((doc) => doc.id)) : undefined;
  }, [signupsSnapshot]);

  // --- Listen to the waitlist subcollection in Firestore ---
  const waitlistRef = collection(db, 'events', eventId, 'waitlist').withConverter(signupConverter);
  const [waitlistSnapshot, waitlistLoading, waitlistError] = useCollection<SignupData>(
    query(waitlistRef, orderBy('signupTime')),
  );
  // map waitlist
  const waitlist = useMemo(() => {
    return waitlistSnapshot?.docs.map((doc) => {
      return {
        ...doc.data(),
        id: doc.id,
      };
    });
  }, [waitlistSnapshot]);
  // create a set of ID's of all people waitlisted
  const waitlistIds = useMemo(() => {
    return waitlistSnapshot ? new Set(waitlistSnapshot.docs.map((doc) => doc.id)) : undefined;
  }, [waitlistSnapshot]);

  // --- Fetch prompts subcollection once from Firestore ---
  const [prompts, setPrompts] = useState<Record<string, PromptData> | undefined>(undefined);
  const [promptsLoading, setPromptsLoading] = useState(true);
  const [promptsError, setPromptsError] = useState<Error | undefined>(undefined);
  useEffect(() => {
    const fetchPrompts = async () => {
      setPromptsLoading(true);
      setPromptsError(undefined);
      try {
        const promptsCollectionRef = collection(db, 'events', eventId, 'prompts').withConverter(
          promptConverter,
        );
        const promptsQuery = query(promptsCollectionRef, orderBy('order'));
        const promptsSnapshot = await getDocs(promptsQuery);
        // map prompts
        const prompts = promptsSnapshot?.docs.reduce<Record<string, PromptData>>(
          (acc, promptDoc) => {
            acc[promptDoc.id] = promptDoc.data();
            return acc;
          },
          {},
        );
        setPrompts(prompts);
      } catch (err) {
        setPromptsError(err as Error);
      } finally {
        setPromptsLoading(false);
      }
    };
    fetchPrompts();
  }, [eventId]);

  const value = useMemo(() => {
    return {
      event,
      eventLoading,
      eventError,
      signups,
      signupIds,
      signupsLoading,
      signupsError,
      waitlist,
      waitlistIds,
      waitlistLoading,
      waitlistError,
      prompts,
      promptsLoading,
      promptsError,
    };
  }, [
    event,
    eventLoading,
    eventError,
    signups,
    signupIds,
    signupsLoading,
    signupsError,
    waitlist,
    waitlistIds,
    waitlistLoading,
    waitlistError,
    prompts,
    promptsLoading,
    promptsError,
  ]);
  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
};

export const useEvent = () => {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
};
