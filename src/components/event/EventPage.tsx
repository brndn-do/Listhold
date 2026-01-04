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
import Button from '@/components/ui/Button';

const COOLDOWN_TIME = 2500; // how long to disable button after successful join/leave
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
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setShareMessage('Link copied!');
    setTimeout(() => {
      setShareMessage(null);
    }, 2000);
  };

  const disableButton = useMemo(() => {
    if (
      listLoading ||
      fetchError ||
      disconnected ||
      responseMessage ||
      requestLoading ||
      requestError ||
      showFlow
    ) {
      return true;
    }
    return false;
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
  };

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
              className={`flex-1 px-6 py-2 text-sm font-semibold border-b-2 border-background transition-color duration-200 ${
                !viewingWaitlist
                  ? 'text-purple-600 dark:text-purple-400 border-purple-600 dark:border-purple-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:cursor-pointer'
              }`}
            >
              Confirmed
            </button>
            <button
              onClick={() => setViewingWaitlist(true)}
              className={`flex-1 px-6 py-2 text-sm font-semibold border-b-2 border-background transition-color duration-200 ${
                viewingWaitlist
                  ? 'text-purple-600 dark:text-purple-400 border-purple-600 dark:border-purple-400'
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
        <div className='hidden lg:flex w-full gap-4 justify-end pr-6'>
          <Button
            onClick={handleShare}
            content={
              <div className='flex gap-2'>
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1'
                  />
                </svg>
              </div>
            }
          />
          <EventButton
            disabled={disableButton}
            handleFlowOpen={handleFlowOpen}
            handleSignup={handleSignup}
            handleLeave={() => setConfirmLeave(true)}
          />
        </div>

        {/* Mobile fixed action button */}
        <div className='w-full fixed bottom-0 lg:hidden z-50'>
          <div className='w-full flex gap-4 justify-end pb-6 pr-6'>
            <Button
              onClick={handleShare}
              content={
                <div className='flex gap-2'>
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1'
                    />
                  </svg>
                </div>
              }
            />
            <EventButton
              disabled={disableButton}
              handleFlowOpen={handleFlowOpen}
              handleSignup={handleSignup}
              handleLeave={() => setConfirmLeave(true)}
            />
          </div>
        </div>

        {/* Share feedback message */}
        {shareMessage && (
          <div className='fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 rounded-lg shadow-lg text-sm'>
            {shareMessage}
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
            <p className='text-2xl font-bold'>{responseMessage}</p>
          </div>
        )}
      </div>

      {/* Dialog for sign-up flow */}
      {showFlow && <SignupFlow handleSubmit={handleSubmit} handleCancel={handleCancel} />}

      {confirmLeave && (
        <div className='fixed inset-0 flex flex-col gap-4 items-center justify-center z-50 bg-white/60 dark:bg-black/60 backdrop-blur'>
          <p className='text-2xl font-bold'>Are you sure?</p>
          <div className='flex gap-4'>
            <Button
              onClick={() => {
                setConfirmLeave(false);
                handleLeave();
              }}
              content={'Leave'}
            />
            <Button onClick={() => setConfirmLeave(false)} content={'Cancel'} />
          </div>
        </div>
      )}
    </div>
  );
};
export default EventPage;
