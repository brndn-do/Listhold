'use client';

import { useEvent } from '@/context/EventProvider';
import ListItem from './ListItem';
import Dots from '@/components/ui/Dots';
import ErrorMessage from '@/components/ui/ErrorMessage';

interface EventListProps {
  viewingWaitlist: boolean;
}

const EventList = ({ viewingWaitlist }: EventListProps) => {
  const { confirmedList, waitlist, listLoading, disconnected } =
    useEvent();

  // does the user want to view the waitlist?
  const selection = viewingWaitlist ? waitlist : confirmedList;

  // helper for handling loading state, error states, empty list, and non-empty list
  const content = () => {
    if (listLoading) {
      return (
        <div className='p-36'>
          <Dots size={3} />
        </div>
      );
    }

    if (selection?.length === 0) {
      return (
        <div className='flex flex-col items-center justify-center w-full h-full'>
          <p className='text-md font-bold'>It&apos;s empty...</p>
        </div>
      );
    }

    return (
      <ol className={`${disconnected ? 'opacity-30 ' : ''}flex-1 flex flex-col items-center w-full overflow-y-auto scrollbar scrollbar-thin gap-1`}>
        {selection.map((signup) => (
          <ListItem signup={signup} key={signup.id} />
        ))}
      </ol>
    );
  };

  return (
    <div className='relative border-1 border-gray-500 rounded-2xl py-2 px-1 flex flex-col items-center w-full h-90'>
      {content()}
      {disconnected && (
        <div className='absolute inset-0 z-[-1] flex items-center justify-center'>
          <div>
            <ErrorMessage content={'You are disconnected.'} />
          </div>
        </div>
      )}
    </div>
  );
};

export default EventList;
