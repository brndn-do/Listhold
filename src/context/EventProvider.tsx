'use client';

import { Prompt } from '@/components/event/signup/PromptView';
import { subscribeToSignups, subscribeToWaitlist } from '@/services/TODO/subscribeToList';
import { SignupData } from '@/types/signupData';
import { WithId } from '@/types/withId';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Shape of the Event context, providing all relevant data for a single event.
 */
interface EventContextType {
  readonly eventId: string;
  readonly name: string;
  readonly description?: string;
  readonly orgSlug: string;
  readonly orgName: string;
  readonly start: Date;
  readonly end?: Date;
  readonly location: string;
  readonly capacity: number;

  /**
   * Order array of the event's prompts.
   */
  readonly prompts: ReadonlyArray<Prompt>;

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

export interface EventProviderProps {
  eventId: string;
  name: string;
  description?: string;
  orgSlug: string;
  orgName: string;
  start: Date;
  end?: Date;
  location: string;
  capacity: number;
  prompts: Prompt[];
  children: ReactNode;
}

/**
 * Provides event-related data (event, signups, waitlist, prompts) via context.
 * @param props.eventId - ID of the event
 * @param props.children - React children to wrap with this provider
 */
export const EventProvider = ({
  eventId,
  name,
  orgSlug,
  orgName,
  description,
  start,
  end,
  location,
  capacity,
  prompts,
  children,
}: EventProviderProps) => {
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
      eventId,
      name,
      orgSlug,
      orgName,
      description,
      start,
      end,
      location,
      capacity,
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
    eventId,
    name,
    orgSlug,
    orgName,
    description,
    start,
    end,
    location,
    capacity,
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
