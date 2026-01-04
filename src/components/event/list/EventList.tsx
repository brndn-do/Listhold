'use client';

import { useEvent } from '@/context/EventProvider';
import ListItem from './ListItem';
import Dots from '@/components/ui/Dots';
import ErrorMessage from '@/components/ui/ErrorMessage';

interface EventListProps {
  viewingWaitlist: boolean;
}

const EventList = ({ viewingWaitlist }: EventListProps) => {
  const { confirmedList, waitlist, listLoading, disconnected } = useEvent();

  // helper for rendering a list (confirmed or waitlist)
  const renderList = (list: typeof confirmedList) => {
    if (listLoading) {
      return (
        <div className='w-full flex justify-center mt-16'>
          <Dots size={3} />
        </div>
      );
    }

    if (list?.length === 0) {
      return (
        <div className='w-full flex justify-center mt-16'>
          <p className='font-bold'>No one yet...</p>
        </div>
      );
    }

    return (
      <ol className='flex-1 flex flex-col items-center w-full overflow-y-auto scrollbar scrollbar-thin gap-1'>
        {list.map((signup, idx) => (
          <ListItem signup={signup} idx={idx} key={signup.id} />
        ))}
      </ol>
    );
  };

  return (
    <div className='relative flex flex-col items-center w-full h-[60dvh] border-1 border-gray-500 rounded-2xl py-2 px-1'>
      {/* Confirmed List */}
      <div 
        className={`absolute inset-0 flex flex-col items-center py-2 px-1 transition-opacity duration-200 ${
          !viewingWaitlist ? (disconnected ? 'opacity-30 z-10' : 'opacity-100 z-10') : 'opacity-0 z-0'
        }`}
      >
        {renderList(confirmedList)}
      </div>

      {/* Waitlist */}
      <div 
        className={`absolute inset-0 flex flex-col items-center py-2 px-1 transition-opacity duration-200 ${
          viewingWaitlist ? (disconnected ? 'opacity-30 z-10' : 'opacity-100 z-10') : 'opacity-0 z-0'
        }`}
      >
        {renderList(waitlist)}
      </div>

      {disconnected && (
        <div className='absolute inset-0 z-[-1] flex items-center justify-center'>
          <div>
            <ErrorMessage content={<p>You are disconnected</p>} />
          </div>
        </div>
      )}
    </div>
  );
};

export default EventList;
