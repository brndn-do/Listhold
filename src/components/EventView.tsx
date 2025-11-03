'use client';

import EventInfo from './EventInfo';
import EventListWrapper from './EventListWrapper';

const EventView = () => {
  return (
    <div className='flex flex-col items-center p-4 gap-2 h-full w-full md:w-[50%] lg:w-[40%] xl:w-[30%] 2xl:w-[25%]'>
      <EventInfo />
      <div className='border-b-1 border-dashed w-[90%]'></div> {/* separator */}
      <EventListWrapper />
    </div>
  );
};
export default EventView;
