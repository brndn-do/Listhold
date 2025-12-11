'use client';

import Dots from '@/components/ui/Dots';
import { formatEventTiming } from '@/utils/timeFormatter';
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

  return (
    <div className='h-4 flex items-center'>
      {!mounted && <Dots size={1} />}
      {mounted && (
        <p className='text-[0.8rem] text-center'>{`📅 ${formatEventTiming(start, end)}`}</p>
      )}
    </div>
  );
};

export default EventTime;
