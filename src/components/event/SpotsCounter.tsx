'use client';

import Dots from '@/components/ui/Dots';
import { useEvent } from '@/context/EventProvider';
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
      return <Dots size={1} />
    }

    if (signupsCount === -1) {
      return <p className='font-bold text-purple-600 dark:text-purple-400'>{`Spots Left: ?/${capacity}`}</p>
    }

    return <p className='font-bold text-purple-600 dark:text-purple-400'>{`Spots Left: ${capacity - signupsCount}/${capacity}`}</p>
  }

  return (
    <div className='h-4 flex items-center'>
      {content()}
    </div>
  );
};

export default SpotsCounter;
