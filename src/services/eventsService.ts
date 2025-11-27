import { db } from '@/lib/firebase';
import { EventData, WithId } from '@/types';
import { collection, getDocs, orderBy, query, Timestamp, where } from 'firebase/firestore';

export const getEventsByOrgId = async (orgId: string): Promise<WithId<EventData>[]> => {
  const eventsColRef = collection(db, 'events');
  const q = query(
    eventsColRef,
    where('organizationId', '==', orgId),
    where('start', '>=', Timestamp.now()),
    orderBy('start', 'asc'),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as EventData),
  }));
};
