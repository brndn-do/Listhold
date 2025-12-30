'use client';

import { useEvent } from '@/context/EventProvider';
import ListItem from './ListItem';
import Dots from '@/components/ui/Dots';

interface EventListProps {
  viewingWaitlist: boolean;
}

const EventList = ({ viewingWaitlist }: EventListProps) => {
  const { confirmedList, waitlist, listLoading, listError } = useEvent();

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

    if (listError) {
      return <p>Error: {listError.message}</p>;
    }

    if (selection?.length === 0) {
      return (
        <div className='flex flex-col items-center justify-center w-full h-full'>
          <p className='text-lg font-bold'>It&apos;s empty...</p>
        </div>
      );
    }

    return (
      <ol className='flex-1 flex flex-col items-center w-full overflow-y-auto scrollbar scrollbar-thin gap-1'>
        {selection.map((signup) => (
          <ListItem signup={signup} key={signup.id} />
        ))}
      </ol>
    );
  };

  return (
    <div className='border-1 border-gray-500 rounded-2xl py-2 px-1 flex flex-col items-center w-full h-90'>
      {content()}
    </div>
  );
};

export default EventList;
