'use client';

import ErrorMessage from '@/components/ui/ErrorMessage';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '@/context/AuthProvider';
import { getMembershipsByUserId } from '@/services/TODO/getMembershipsByUserId';
import { MembershipData } from '@/types/membershipData';
import { WithId } from '@/types/withId';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const MembershipsView = () => {
  const { user } = useAuth();
  const [memberships, setMemberships] = useState<WithId<MembershipData>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const result = await getMembershipsByUserId(user.uid);
        setMemberships(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return <ErrorMessage content={'An unexpected error occured. Try refreshing the page.'} />;
  }

  if (!memberships || memberships.length === 0) {
    return (
      <div className='flex justify-center py-8'>
        <p className='text-gray-500'>You are not in any organizations.</p>
      </div>
    );
  }

  return (
    <div className='grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'>
      {memberships.length > 0 &&
        memberships.map((membership) => {
          const { id: orgId, organizationName: orgName, role } = membership;
          return (
            <Link
              href={`/organizations/${encodeURI(orgId)}`}
              key={orgId}
              className='group flex flex-col gap-8 rounded-lg border p-3 transition-all duration-250 ease-in hover:scale-103 hover:border-purple-600 hover:text-purple-600 dark:hover:border-purple-500 dark:hover:text-purple-500'
            >
              <div className='flex flex-col gap-1'>
                <h2 className='text-md text-center font-bold'>{orgName}</h2>
                <p className='text-xs text-center'>{`Role: ${role}`}</p>
              </div>

              <p className='md:hidden mt-auto self-end text-center text-xs font-medium text-purple-600 dark:text-purple-500'>
                Tap to view →
              </p>
            </Link>
          );
        })}
    </div>
  );
};

export default MembershipsView;
