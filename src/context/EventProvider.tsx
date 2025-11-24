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

/**
 * Shape of the Event context, providing all relevant Firestore data for a single event.
 */
interface EventContextType {
  /**
   * The main event document data, including the document ID.
   * `undefined` if the data is not yet loaded.
   */
  readonly event: WithId<EventData> | undefined;

  /** Whether the event document is currently loading. */
  readonly eventLoading: boolean;

  /** Error encountered while loading the event document, if any. */
  readonly eventError: FirestoreError | undefined;

  /**
   * Array of signups in the main list.
   * Each signup includes its document ID.
   * Sorted by `signupTime` timestamp.
   * `undefined` if data is not yet loaded.
   */
  readonly signups: ReadonlyArray<WithId<SignupData>> | undefined;

  /** Set of user IDs corresponding to all signups in the main list. */
  readonly signupIds: ReadonlySet<string> | undefined;

  /** Whether the main signup list is currently loading. */
  readonly signupsLoading: boolean;

  /** Error encountered while loading the main signup list, if any. */
  readonly signupsError: FirestoreError | undefined;

  /**
   * Array of signups in the waitlist.
   * Each signup includes its document ID.
   * Sorted by `signupTime` timestamp.
   * `undefined` if data is not yet loaded.
   */
  readonly waitlist: ReadonlyArray<WithId<SignupData>> | undefined;

  /** Set of user IDs corresponding to all signups in the waitlist. */
  readonly waitlistIds: ReadonlySet<string> | undefined;

  /** Whether the waitlist is currently loading. */
  readonly waitlistLoading: boolean;

  /** Error encountered while loading the waitlist, if any. */
  readonly waitlistError: FirestoreError | undefined;

  /**
   * Map of prompt document IDs to prompt data.
   * `undefined` if the prompts have not been loaded yet.
   */
  readonly prompts: Readonly<Record<string, PromptData>> | undefined;

  /** Whether the prompts are currently loading. */
  readonly promptsLoading: boolean;

  /** Error encountered while loading prompts, if any. */
  readonly promptsError: Error | undefined;
}

/**
 * Generic Firestore data converter for a given type.
 * @template T - The TypeScript type to convert.
 * @returns FirestoreDataConverter<T>
 */
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

/** React context for providing event data throughout the app */
const EventContext = createContext<EventContextType | undefined>(undefined);

/**
 * Provides event-related data (event, signups, waitlist, prompts) via context.
 * @param props.eventId - ID of the Firestore event document
 * @param props.children - React children to wrap with this provider
 */
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
