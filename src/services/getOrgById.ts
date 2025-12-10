import 'server-only';

import { adminDb } from '@/lib/firebase-admin';
import { OrganizationData } from '@/types/organizationData';
import { WithId } from '@/types/withId';
import { Timestamp } from 'firebase/firestore';
import { unstable_cache } from 'next/cache';

/**
 * Fetches an organization by its ID.
 *
 * @param orgId - The unique identifier of the organization
 * @returns A Promise resolving to the organization data with its ID, or null if not found
 */
const getOrgByIdInteral = async (orgId: string): Promise<WithId<OrganizationData> | null> => {
  const ref = adminDb.doc(`organizations/${orgId}`);
  const snap = await ref.get();

  if (!snap.exists) {
    return null;
  }

  const data = snap.data() as {
    name: string;
    description?: string;
    ownerId: string;
    createdAt: Timestamp;
  };

  const { createdAt, ...rest } = data;

  return {
    id: orgId,
    createdAt: createdAt.toDate(),
    ...(rest as Omit<OrganizationData, 'createdAt'>),
  };
};

/**
 * Fetches an organization by its ID with Next.js caching.
 *
 * @param orgId - The unique identifier of the organization to fetch.
 *
 * @returns A promise resolving to the organization's data including its ID, or `null`
 * if the organization does not exist.
 *
 * @remarks
 * - Revalidates every 60 seconds.
 * - Tagged with `"orgs"` for group invalidation.
 * - Runs only on the server (`server-only`).
 */
export const getOrgById = unstable_cache(
  async (orgId: string) => getOrgByIdInteral(orgId),
  ['getOrgById'], // global cache key
  {
    revalidate: 60,
    tags: ['orgs'],
  },
);
