'use client';

import LoadingDots from '@/features/_shared/components/ui/LoadingDots';
import { formatEventTiming } from '@/features/_shared/utils/timeFormatter';
import { useEffect, useState } from 'react';

interface EventTimeProps {
  start: Date;
  end?: Date;
}

const EventTime = ({ start, end }: EventTimeProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className='pt-1 pl-1'>
        <LoadingDots size={1} />
      </div>
    );
  }

  return (
    <div className='flex w-full items-center pt-1'>
      <p>{`${formatEventTiming(start, end)}`}</p>
    </div>
  );
};

export default EventTime;
