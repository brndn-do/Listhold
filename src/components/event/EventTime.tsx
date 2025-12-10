'use client';

import { formatEventTiming } from '@/utils/timeFormatter';

interface EventTimeProps {
  start: Date;
  end?: Date;
}

const EventTime = ({start, end }: EventTimeProps) => {
  return <p className='text-[0.8rem] text-center'>{`📅 ${formatEventTiming(start, end)}`}</p>;
};

export default EventTime;
