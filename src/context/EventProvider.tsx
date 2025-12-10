'use client';

import { subscribeToSignups, subscribeToWaitlist } from '@/services/subscribeToList';
import { EventData } from '@/types/eventData';
import { PromptData } from '@/types/promptData';
import { SignupData } from '@/types/signupData';
import { WithId } from '@/types/withId';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Shape of the Event context, providing all relevant data for a single event.
 */
interface EventContextType {
  /**
   * The main event data, including ID.
   */
  readonly eventData: WithId<EventData>;

  /**
   * Map of prompt IDs to prompt data.
   */
  readonly prompts: Readonly<Record<string, PromptData>>;

  /**
   * Array of signups in the main list.
   * Each signup includes its ID.
   * Sorted by `signupTime` timestamp.
   */
  readonly signups: ReadonlyArray<WithId<SignupData>>;

  /** Set of user IDs corresponding to all signups in the main list. */
  readonly signupIds: ReadonlySet<string>;

  /** Whether the main signup list is currently loading. */
  readonly signupsLoading: boolean;

  /** Error encountered while loading the main signup list, if any. */
  readonly signupsError: Error | null;

  /**
   * Array of signups in the waitlist.
   * Each signup includes its ID.
   * Sorted by `signupTime` timestamp.
   */
  readonly waitlist: ReadonlyArray<WithId<SignupData>>;

  /** Set of user IDs corresponding to all signups in the waitlist. */
  readonly waitlistIds: ReadonlySet<string>;

  /** Whether the waitlist is currently loading. */
  readonly waitlistLoading: boolean;

  /** Error encountered while loading the waitlist, if any. */
  readonly waitlistError: Error | null;
}

/** React context for providing event data throughout the app */
const EventContext = createContext<EventContextType | undefined>(undefined);

/**
 * Provides event-related data (event, signups, waitlist, prompts) via context.
 * @param props.eventId - ID of the event
 * @param props.children - React children to wrap with this provider
 */
export const EventProvider = ({
  eventData,
  prompts,
  children,
}: {
  eventData: WithId<EventData>;
  prompts: Record<string, PromptData>;
  children: ReactNode;
}) => {
  const eventId = eventData.id;

  const [signups, setSignups] = useState<WithId<SignupData>[]>([]);
  const [signupsLoading, setSignupsLoading] = useState(true);
  const [signupsError, setSignupsError] = useState<Error | null>(null);

  const [waitlist, setWaitlist] = useState<WithId<SignupData>[]>([]);
  const [waitlistLoading, setWaitlistLoading] = useState(true);
  const [waitlistError, setWaitlistError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubSignups = subscribeToSignups(
      eventId,
      (data) => {
        setSignups(data);
        setSignupsLoading(false);
      },
      (error) => {
        setSignupsError(error);
        setSignupsLoading(false);
      },
    );

    const unsubWaitlist = subscribeToWaitlist(
      eventId,
      (data) => {
        setWaitlist(data);
        setWaitlistLoading(false);
      },
      (error) => {
        setWaitlistError(error);
        setWaitlistLoading(false);
      },
    );

    return () => {
      unsubSignups();
      unsubWaitlist();
    };
  }, [eventId]);

  const signupIds: Set<string> = useMemo(() => {
    return new Set(signups.map((s) => s.id));
  }, [signups]);

  const waitlistIds: Set<string> = useMemo(() => {
    return new Set(waitlist.map((w) => w.id));
  }, [waitlist]);

  const value = useMemo(() => {
    return {
      eventData,
      prompts,
      signups,
      signupIds,
      signupsLoading,
      signupsError,
      waitlist,
      waitlistIds,
      waitlistLoading,
      waitlistError,
    };
  }, [
    eventData,
    prompts,
    signups,
    signupIds,
    signupsLoading,
    signupsError,
    waitlist,
    waitlistIds,
    waitlistLoading,
    waitlistError,
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
