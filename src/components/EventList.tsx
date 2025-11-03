import { useAuth } from '@/context/AuthProvider';
import { useEvent } from '@/context/EventProvider';
import Spinner from './Spinner';

const EventList = ({ viewWaitlist }: { viewWaitlist: boolean }) => {
  const { user } = useAuth();
  const { signups, signupsLoading, signupsError, waitlist, waitlistLoading, waitlistError } =
    useEvent();
  // does the user want to view the waitlist?
  const selection = viewWaitlist ? waitlist : signups;
  const selectionLoading = viewWaitlist ? waitlistLoading : signupsLoading;
  const selectionError = viewWaitlist ? waitlistError : signupsError;

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
    <div className='flex flex-col items-center w-full h-full'>
      <ol className='flex-1 flex flex-col w-full overflow-y-auto scrollbar scrollbar-thin items-center list-decimal list-inside'>
        {selection?.map((signup) => (
          <li
            className={user?.uid === signup.uid ? 'text-purple-700 dark:text-purple-500' : ''}
            key={signup.uid}
          >{`${signup.displayName}`}</li>
        ))}
      </ol>
      {/* gradient fade hint */}
      <div className='pointer-events-none absolute top-0 p-2 w-full h-4 bg-gradient-to-b from-[#f6f6f6ff] dark:from-[#191919] to-transparent rounded-t-2xl' />
      {/* gradient fade hint */}
      <div className='pointer-events-none absolute bottom-0 p-2 w-full h-4 bg-gradient-to-t from-[#f6f6f6ff] dark:from-[#191919] to-transparent rounded-b-2xl' />
    </div>
  );
};

export default EventList;
