'use client';

import { useEvent } from '@/context/EventProvider';
import Spinner from '../../ui/Spinner';
import ListItem from './ListItem';

const EventList = ({ viewingWaitlist }: { viewingWaitlist: boolean }) => {
  const { signups, signupsLoading, signupsError, waitlist, waitlistLoading, waitlistError } =
    useEvent();

  // does the user want to view the waitlist?
  const selection = viewingWaitlist ? waitlist : signups;
  const selectionLoading = viewingWaitlist ? waitlistLoading : signupsLoading;
  const selectionError = viewingWaitlist ? waitlistError : signupsError;

  if (selectionLoading) {
    return <div>{<Spinner />}</div>;
  }

  if (selectionError) {
    return <p>Error: {selectionError.message}</p>;
  }

  if (selection?.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center w-full h-full'>
        <p className='text-lg font-bold'>It&apos;s empty...</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col w-full h-full'>
      <ol className='flex-1 flex flex-col items-center w-full overflow-y-auto scrollbar scrollbar-thin gap-1'>
        {selection?.map((signup) => (
          <ListItem signup={signup} key={signup.id} />
        ))}
      </ol>
    </div>
  );
};

export default EventList;
