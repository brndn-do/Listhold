import 'server-only';

import { adminDb, Timestamp } from '@/lib/firebase-admin';
import { EventData } from '@/types/clientEventData';
import { WithId } from '@/types/withId';

/**
 * Fetches an organization's events
 * @param orgId - The organization's unique ID
 * @returns An array of event data's with their ID's, empty if no events exist.
 */
export const getEventsByOrgId = async (orgId: string): Promise<WithId<EventData>[]> => {
  const ref = adminDb.collection('events');

  const snap = await ref
    .where('organizationId', '==', orgId)
    .where('start', '>=', Timestamp.now())
    .orderBy('start', 'asc')
    .get();

  return snap.docs.map((doc) => {
    const { start, end, createdAt, ...rest } = doc.data();
    return {
      id: doc.id,
      start: start.toDate(),
      end: end?.toDate(),
      createdAt: createdAt?.toDate(),
      ...(rest as Omit<EventData, 'start' | 'end' | 'createdAt'>),
    };
  });
};
