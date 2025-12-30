'use client';

import { Prompt } from '@/components/event/signup/PromptView';
import { fetchInitialList, SignupData } from '@/services/fetchInitialList';
import { subscribeToList } from '@/services/subscribeToList';
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
   * Array of confirmed signups.
   * Each signup includes its ID.
   * Sorted by `createdAt` in ascending order.
   */
  readonly confirmedList: ReadonlyArray<SignupData>;

  /**
   * Array of waitlisted signups.
   * Each signup includes its ID.
   * Sorted by `createdAt` in ascending order.
   */
  readonly waitlist: ReadonlyArray<SignupData>;

  /** Set of user IDs corresponding to all confirmed signups. */
  readonly confirmedUserIds: ReadonlySet<string>;

  /** Set of user IDs corresponding to all waitlisted signups. */
  readonly waitlistUserIds: ReadonlySet<string>;

  /** Whether the initial list is currently loading. */
  readonly listLoading: boolean;

  /** Error encountered while loading the initial list, if any. */
  readonly listError: Error | null;
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
  const [confirmedList, setConfirmedList] = useState<SignupData[]>([]);
  const [waitlist, setWaitlist] = useState<SignupData[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchList = async () => {
      try {
        const result = await fetchInitialList(eventId);
        setConfirmedList(result.filter((val) => val.status === 'confirmed'));
        setWaitlist(result.filter((val) => val.status === 'waitlisted'));
      } catch (err) {
        if (err instanceof Error) {
          setListError(err);
        } else {
          setListError(new Error(String(err)));
        }
      } finally {
        setListLoading(false);
      }
    };
    const unsub = subscribeToList(eventId, fetchList);
    fetchList();

    return () => {
      unsub();
    }
  }, [eventId]);

  const confirmedUserIds: Set<string> = useMemo(() => {
    return new Set(confirmedList.map((s) => s.userId));
  }, [confirmedList]);

  const waitlistUserIds: Set<string> = useMemo(() => {
    return new Set(waitlist.map((s) => s.userId));
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
      confirmedList: confirmedList,
      confirmedUserIds: confirmedUserIds,
      waitlist: waitlist,
      waitlistUserIds: waitlistUserIds,
      listLoading: listLoading,
      listError: listError,
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
    confirmedList,
    confirmedUserIds,
    waitlist,
    waitlistUserIds,
    listLoading,
    listError,
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
