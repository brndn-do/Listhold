'use client';

import EventInfo from './EventInfo';
import { useAuth } from '@/context/AuthProvider';
import { useEvent } from '@/context/EventProvider';
import { useMemo, useState } from 'react';
import EventList from '@/components/event/list/EventList';
import EventButton from '@/components/event/EventButton';
import SignupFlow from '@/components/event/signup/SignupFlow';
import { addUserToEvent } from '@/services/addUserToEvent';
import { removeUserFromEvent } from '@/services/removeUserFromEvent';
import Dots from '@/components/ui/Dots';
import ErrorMessage from '@/components/ui/ErrorMessage';

const COOLDOWN_TIME = 3000; // how long to disable button after successful join/leave
const ERROR_TIME = 5000; // how long to display error before allowing retries

const EventPage = () => {
  const { user } = useAuth();
  const { eventId, listLoading, fetchError, disconnected } = useEvent();
  const userId = user?.uid;

  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  const [requestLoading, setRequestLoading] = useState(false); // whether the request to join/leave is loading
  const [requestError, setRequestError] = useState<string | null>(null); // whether the request to join/leave errored
  const [viewingWaitlist, setViewingWaitlist] = useState(false); // is the user viewing waitlist or the main list?
  const [showFlow, setShowFlow] = useState(false); // whether to display the sign-up wizard/flow

  const showButton = useMemo(() => {
    if (
      listLoading ||
      fetchError ||
      disconnected ||
      responseMessage ||
      requestLoading ||
      requestError ||
      showFlow
    ) {
      return false;
    }
    return true;
  }, [
    listLoading,
    fetchError,
    disconnected,
    responseMessage,
    requestLoading,
    requestError,
    showFlow,
  ]);

  const handleFlowOpen = () => {
    setShowFlow(true);
  };

  const handleSubmit = (answers: Record<string, boolean | null>) => {
    setShowFlow(false);
    handleSignup(answers);
  };

  const handleCancel = () => {
    setShowFlow(false);
  }

  const handleSignup = async (answers: Record<string, boolean | null>) => {
    if (!eventId || !userId) {
      return;
    }
    setRequestLoading(true);
    try {
      const res = await addUserToEvent(eventId, userId, answers);
      // set a cooldown to make sure users can't spam
      setResponseMessage(res === 'confirmed' ? 'You joined the list!' : 'You joined the waitlist!');
      setTimeout(() => {
        setResponseMessage(null);
      }, COOLDOWN_TIME);
    } catch (err: unknown) {
      setRequestError('An unexpected error occured. Try again in a bit.');
      setTimeout(() => {
        setRequestError(null);
      }, ERROR_TIME);
    } finally {
      setRequestLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!eventId || !userId) {
      return;
    }
    setRequestLoading(true);
    try {
      const res = await removeUserFromEvent(eventId, userId);
      // set a cooldown to make sure users can't spam
      setResponseMessage(res === 'confirmed' ? 'You left the list.' : 'You left the waitlist.');
      setTimeout(() => {
        setResponseMessage(null);
      }, COOLDOWN_TIME);
    } catch (err: unknown) {
      setRequestError('An unexpected error occured. Try again in a bit.');
      setTimeout(() => {
        setRequestError(null);
      }, ERROR_TIME);
    } finally {
      setRequestLoading(false);
    }
  };

  return (
    <div className='mx-auto flex flex-col lg:flex-row lg:justify-evenly w-full md:w-[60%] lg:w-[80%] gap-2 lg:gap-4'>
      <EventInfo />

      <div className='border-t-1 border-dashed pt-4 lg:border-0 lg:pt-0 w-full xl:w-[80%] 2xl:w-[35%] h-full flex flex-col items-center'>
        <div className='w-full mb-3'>
          {/* Header */}
          <h1 className='text-2xl font-bold text-center text-gray-900 dark:text-gray-100'>
            Signups
          </h1>

          {/* Tabs */}
          <div className='flex w-[90%] mx-auto'>
            <button
              onClick={() => setViewingWaitlist(false)}
              className={`flex-1 px-6 py-2 text-sm font-semibold border-b-2 border-background ${
                !viewingWaitlist
                  ? 'text-purple-700 dark:text-purple-400 border-purple-600 dark:border-purple-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:cursor-pointer'
              }`}
            >
              Confirmed
            </button>
            <button
              onClick={() => setViewingWaitlist(true)}
              className={`flex-1 px-6 py-2 text-sm font-semibold border-b-2 border-background ${
                viewingWaitlist
                  ? 'text-purple-700 dark:text-purple-400 border-purple-600 dark:border-purple-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:cursor-pointer'
              }`}
            >
              Waitlist
            </button>
          </div>

          {/* List Content */}
          <div className='pt-2'>
            <EventList viewingWaitlist={viewingWaitlist} />
          </div>
        </div>

        {/* Desktop Action Button */}
        {showButton && (
          <div className='hidden lg:flex w-full flex justify-end pr-6'>
            <EventButton
              handleFlowOpen={handleFlowOpen}
              handleSignup={handleSignup}
              handleLeave={handleLeave}
            />
          </div>
        )}

        {/* Mobile fixed action button */}
        {showButton && (
          <div className='w-full fixed bottom-0 lg:hidden z-50'>
            <div className='w-full flex justify-end pb-6 pr-6'>
              <EventButton
                handleFlowOpen={handleFlowOpen}
                handleSignup={handleSignup}
                handleLeave={handleLeave}
              />
            </div>
          </div>
        )}

        {/* Full-screen Overlays */}
        {requestLoading && (
          <div className='fixed inset-0 flex items-center justify-center z-50 bg-white/60 dark:bg-black/60 backdrop-blur'>
            <Dots size={4} />
          </div>
        )}
        {requestError && (
          <div className='fixed inset-0 flex items-center justify-center z-50 bg-white/60 dark:bg-black/60 backdrop-blur'>
            <ErrorMessage size={'xl'} content={requestError} />
          </div>
        )}
        {responseMessage && (
          <div className='fixed inset-0 flex items-center justify-center z-50 bg-white/60 dark:bg-black/60 backdrop-blur'>
            <p className='text-2xl'>{responseMessage}</p>
          </div>
        )}
      </div>

      {/* Dialog for sign-up flow */}
      {showFlow && <SignupFlow handleSubmit={handleSubmit} handleCancel={handleCancel} />}
    </div>
  );
};
export default EventPage;
