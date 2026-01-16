'use client';

import { Prompt } from '@/components/event/signup/PromptView';
import { fetchList, SignupData } from '@/services/fetchList';
import { subscribeToList } from '@/services/subscribeToList';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

/**
 * Shape of the Event context, providing all relevant data for a single event.
 */
interface EventContextType {
  readonly eventId: string;
  readonly name: string;
  readonly description?: string;
  readonly orgSlug?: string;
  readonly orgName?: string;
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

  /** Error encountered while making a fetches to the list, if any. */
  readonly fetchError: Error | null;

  /** Whether at least one successful fetch was made. */
  readonly successfulFetch: boolean;

  /** Whether connected to realtime channel */
  readonly realtimeConnected: boolean;

  /** True if not connected to realtime channel or a fetch fails after a successful fetch */
  readonly disconnected: boolean;

  /** Refresh callback */
  readonly refreshList: () => Promise<void>;
}

/** React context for providing event data throughout the app */
const EventContext = createContext<EventContextType | undefined>(undefined);

export interface EventProviderProps {
  eventId: string;
  name: string;
  description?: string;
  orgSlug?: string;
  orgName?: string;
  start: Date;
  end?: Date;
  location: string;
  capacity: number;
  prompts: Prompt[];
  children: ReactNode;
}

const POLL_INTERVAL = 5000;

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
  const [fetchError, setFetchError] = useState<Error | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  // true if there was at least one successful fetch. Used to display outdated data.
  const [successfulFetch, setSuccessfulFetch] = useState(false);

  const disconnected = useMemo(() => {
    if (listLoading || !successfulFetch) {
      // we are "connecting" rather than "disconnected"
      return false;
    }
    return !!fetchError;
  }, [listLoading, fetchError, successfulFetch]);

  const refreshList = useCallback(async () => {
    try {
      const result = await fetchList(eventId);

      setConfirmedList(result.filter((val) => val.status === 'confirmed'));
      setWaitlist(result.filter((val) => val.status === 'waitlisted'));
      setSuccessfulFetch(true);
      setFetchError(null);
    } catch (err) {
      setFetchError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setListLoading(false);
    }
  }, [eventId]);

  // 1. Initial load: fetch on mount
  useEffect(() => {
    refreshList();
  }, [refreshList]);
  
  // 2. Realtime subscription
  useEffect(() => {
    const unsub = subscribeToList(eventId, refreshList, setRealtimeConnected);
    return () => {
      unsub();
    };
  }, [eventId, refreshList]);

  // 3. Polling fallback: if realtime disconnected, poll every 5 seconds
  useEffect(() => {
    if (realtimeConnected || listLoading) return;

    const intervalId = setInterval(() => {
      refreshList();
    }, POLL_INTERVAL)

    return () => clearInterval(intervalId);
  }, [realtimeConnected, listLoading, refreshList]);

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
      confirmedList,
      confirmedUserIds,
      waitlist,
      waitlistUserIds,
      listLoading,
      fetchError,
      successfulFetch,
      realtimeConnected,
      disconnected,
      refreshList,
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
    fetchError,
    successfulFetch,
    realtimeConnected,
    disconnected,
    refreshList,
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
