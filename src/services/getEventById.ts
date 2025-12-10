import 'server-only';

import { adminDb } from '@/lib/firebase-admin';
import { EventData } from '@/types/eventData';
import { WithId } from '@/types/withId';
import { Timestamp } from 'firebase/firestore';
import { unstable_cache } from 'next/cache';

/**
 * Fetches an event by its ID.
 *
 * @param eventId - The unique identifier of the event
 * @returns A Promise resolving to the event data with its ID, or null if not found
 */
const getEventByIdInternal = async (eventId: string): Promise<WithId<EventData> | null> => {
  const ref = adminDb.doc(`events/${eventId}`);
  const snap = await ref.get();

  if (!snap.exists) {
    return null;
  }

  const { start, end, createdAt, ...rest } = snap.data() as {
    name: string;
    description?: string;
    organizationId: string;
    organizationName: string;
    creatorId: string;
    location: string;
    start: Timestamp;
    end?: Timestamp;
    capacity: number;
    signupsCount: number;
    createdAt: Timestamp;
  };

  return {
    id: eventId,
    start: start.toDate(),
    end: end?.toDate(),
    createdAt: createdAt?.toDate(),
    ...(rest as Omit<EventData, 'start' | 'end' | 'createdAt'>),
  };
};

/**
 * Fetches an event by its ID with Next.js caching.
 *
 * @param eventId - The unique identifier of the event to fetch.
 *
 * @returns A promise resolving to the event data including its ID, or `null`
 * if the event does not exist.
 *
 * @remarks
 * - Revalidates every 60 seconds.
 * - Tagged with `"events"` for group invalidation.
 * - Runs only on the server (`server-only`).
 */
export const getEventById = unstable_cache(
  async (eventId: string) => getEventByIdInternal(eventId),
  ['getEventById'], // global cache key
  {
    revalidate: 60, // adjust as needed
    tags: ['events'], // optional, useful for invalidation
  },
);
