import { db } from '@/lib/firebase';
import { MembershipData } from '@/types/membershipData';
import { WithId } from '@/types/withId';
import { collection, getDocs } from 'firebase/firestore';

export const getMembershipsByUserId = async (userId: string): Promise<WithId<MembershipData>[]> => {
  const colRef = collection(db, `/users/${userId}/memberships`);
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as MembershipData),
  }));
};
