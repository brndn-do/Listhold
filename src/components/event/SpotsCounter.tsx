'use client';

import Dots from '@/components/ui/Dots';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { useEvent } from '@/context/EventProvider';
import { useMemo } from 'react';

interface SpotsCounterProps {
  capacity: number;
}

const SpotsCounter = ({ capacity }: SpotsCounterProps) => {
  const { confirmedList, listLoading, listError } = useEvent();
  const signupsCount = useMemo(() => {
    return confirmedList.length;
  }, [confirmedList]);

  return (
    <div className='h-4 flex items-center'>
      {listLoading && <Dots size={1} />}
      {listError && (
        <ErrorMessage size='sm' content={`Couldn't load signups. Try refreshing the page.`} />
      )}
      {!listLoading && !listError && (
        <p className='text-[0.8rem] text-center font-bold text-purple-700 dark:text-purple-500'>{`Spots Left: ${capacity - signupsCount}/${capacity}`}</p>
      )}
    </div>
  );
};

export default SpotsCounter;
