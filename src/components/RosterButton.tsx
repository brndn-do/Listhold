import { useAuth } from '@/context/AuthProvider';
import { SignupData } from '@/types';
import Spinner from './Spinner';

interface RosterButtonProps {
  alreadyJoined: boolean;
  spotsOpen: boolean;
  cooldown: boolean;
  isLoading: boolean;
  functionError: string | null;
  signups: SignupData[] | undefined;
  handleSignup: () => unknown;
  handleLeave: () => unknown;
}

const RosterButton = ({
  alreadyJoined,
  spotsOpen,
  cooldown,
  isLoading,
  functionError,
  handleSignup,
  handleLeave,
}: RosterButtonProps) => {
  const { user } = useAuth();

  // if there's an error display the error instead of a button
  if (functionError) {
    return <p className='mt-2 text-sm text-red-600 self-end'>{functionError}</p>;
  }

  // must sign in first to do anything
  if (!user) {
    return (
      <button
        disabled={true}
        className='opacity-35 focus:outline-none text-sm text-white bg-purple-700 font-medium rounded-lg text-sm px-3.5 py-2 dark:bg-purple-600 dark:focus:ring-purple-900'
      >
        Sign in to join the list.
      </button>
    );
  }
  // already joined, allow leaving the event
  if (alreadyJoined) {
    return (
      <button
        onClick={handleLeave}
        disabled={isLoading || cooldown}
        className={`${isLoading || cooldown ? 'opacity-35' : 'hover:cursor-pointer'} inline-flex focus:outline-none text-sm text-white bg-purple-700 hover:bg-purple-800 font-medium rounded-lg text-sm px-3.5 py-2 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900`}
      >
        {isLoading && <Spinner />}
        {isLoading && 'Leaving...'}
        {!isLoading && cooldown && 'You joined the list!'}
        {!isLoading && !cooldown && 'Leave this event'}
      </button>
    );
  }
  // no spots, disable
  if (!spotsOpen) {
    <button
      disabled={true}
      className='focus:outline-none text-sm text-white bg-purple-700 font-medium rounded-lg text-sm px-3.5 py-2 dark:bg-purple-700 dark:focus:ring-purple-900'
    >
      There are no spots left.
    </button>;
  }
  // default (can join)
  return (
    <button
      onClick={handleSignup}
      disabled={isLoading || cooldown}
      className={`${isLoading || cooldown ? 'opacity-35' : 'hover:cursor-pointer'} inline-flex focus:outline-none text-sm text-white bg-purple-700 hover:bg-purple-800 font-medium rounded-lg text-sm px-3.5 py-2 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900`}
    >
      {isLoading && <Spinner />}
      {isLoading && 'Joining...'}
      {!isLoading && cooldown && 'You left the list.'}
      {!isLoading && !cooldown && 'Join the List'}
    </button>
  );
};

export default RosterButton;
