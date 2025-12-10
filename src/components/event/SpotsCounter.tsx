'use client';

import ErrorMessage from '@/components/ui/ErrorMessage';
import Spinner from '@/components/ui/Spinner';
import { useEvent } from '@/context/EventProvider';
import { useMemo } from 'react';

interface SpotsCounterProps {
  capacity: number;
}

const SpotsCounter = ({ capacity }: SpotsCounterProps) => {
  const { signups, signupsLoading, signupsError } = useEvent();
  const signupsCount = useMemo(() => {
    return signups.length;
  }, [signups]);

  if (signupsLoading) {
    return (
      <div className='p-[2px]'>
        <Spinner size={15} />
      </div>
    );
  }
  if (signupsError) {
    return <ErrorMessage size='sm' content={`Couldn't load signups. Try refreshing the page.`} />;
  }

  return (
    <p className='text-[0.8rem] text-center font-bold text-purple-700 dark:text-purple-500'>{`Spots Left: ${capacity - signupsCount}/${capacity}`}</p>
  );
};

export default SpotsCounter;
