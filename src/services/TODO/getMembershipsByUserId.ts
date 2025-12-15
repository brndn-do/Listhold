import { db } from '@/lib/firebase';
import { MembershipData } from '@/types/membershipData';
import { WithId } from '@/types/withId';
import { collection, getDocs } from 'firebase/firestore';

/**
 * Fetches a user's organization memberships
 * @param userId - The user's uid.
 * @returns An array of membership data's with their ID's, empty if no memberships exist.
 */
export const getMembershipsByUserId = async (userId: string): Promise<WithId<MembershipData>[]> => {
  const colRef = collection(db, `/users/${userId}/memberships`);
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as MembershipData),
  }));
};
