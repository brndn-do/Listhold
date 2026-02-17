'use client';

import LoadingDots from '@/features/_shared/components/ui/LoadingDots';
import { useEvent } from '@/features/events/context/EventProvider';
import { useMemo } from 'react';

interface SpotsCounterProps {
  capacity: number;
}

const SpotsCounter = ({ capacity }: SpotsCounterProps) => {
  const { confirmedList, listLoading, fetchError, successfulFetch } = useEvent();
  const signupsCount = useMemo<number>(() => {
    if (fetchError && !successfulFetch) {
      return -1;
    }
    return confirmedList.length;
  }, [confirmedList, fetchError, successfulFetch]);

  const content = () => {
    if (listLoading) {
      return (
        <div className='pt-1 pl-1'>
          <LoadingDots size={1} />
        </div>
      );
    }

    if (signupsCount === -1) {
      return (
        <p className='font-bold text-purple-600 dark:text-purple-400'>{`Spots Left: ?/${capacity}`}</p>
      );
    }

    return (
      <p className='font-bold text-purple-600 dark:text-purple-400'>{`Spots Left: ${capacity - signupsCount}/${capacity}`}</p>
    );
  };

  return <div className='flex h-4 items-center'>{content()}</div>;
};

export default SpotsCounter;
