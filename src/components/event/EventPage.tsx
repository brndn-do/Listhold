'use client';

import EventInfo from './EventInfo';
import { useAuth } from '@/context/AuthProvider';
import { useEvent } from '@/context/EventProvider';
import { useState } from 'react';
import EventList from '@/components/event/list/EventList';
import EventButton from '@/components/event/EventButton';
import SignupFlow from '@/components/event/signup/SignupWizard';
import { addUserToEvent } from '@/services/addUserToEvent';
import { removeUserFromEvent } from '@/services/removeUserFromEvent';
import Dots from '@/components/ui/Dots';
import ErrorMessage from '@/components/ui/ErrorMessage';
import Button from '@/components/ui/Button';
import ShareButton from '@/components/event/ShareButton';
import ShareFeedbackMessage from '@/components/event/ShareFeedbackMessage';

const SUCCESS_COOLDOWN_TIME = 2500; // how long to disable button after successful join/leave
const ERROR_COOLDOWN_TIME = 5000; // how long to display error before allowing retries

const EventPage = () => {
  const { user } = useAuth();

  const { eventId, listLoading, fetchError, disconnected, realtimeConnected, refreshList } =
    useEvent();

  // whether we are polling or not (if there's an issue with realtime, we are polling)
  const polling = !realtimeConnected;

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // whether the request to join/leave is loading
  const [error, setError] = useState<string | null>(null); // whether the request to join/leave errored
  const [viewingWaitlist, setViewingWaitlist] = useState(false); // is the user viewing waitlist or the main list?
  const [showWizard, setShowWizard] = useState(false); // whether to display the sign-up wizard
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const disableButton = !!(
    listLoading ||
    fetchError ||
    disconnected ||
    successMessage ||
    loading ||
    error ||
    showWizard
  );

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setShareMessage('Link copied!');
    setTimeout(() => {
      setShareMessage(null);
    }, 2000);
  };

  const displaySuccessWithTimeout = async (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage(null);
    }, SUCCESS_COOLDOWN_TIME);
  };

  const displayErrorWithTimeout = async (message: string) => {
    setError(message);
    setTimeout(() => {
      setError(null);
    }, ERROR_COOLDOWN_TIME);
  };

  const displayLoading = () => {
    setLoading(true);
    setConfirmLeave(false);
    setShowWizard(false);
    setSuccessMessage(null);
    setError(null);
  };

  const handleSignup = async (answers: Record<string, boolean | null>) => {
    if (!user?.uid) return;
    displayLoading();
    try {
      const res = await addUserToEvent(eventId, user.uid, answers);
      if (polling) {
        // refresh immediately to reflect changes
        refreshList();
      }
      // set a cooldown to make sure users can't spam
      displaySuccessWithTimeout(
        res === 'confirmed' ? 'You joined the list!' : 'You joined the waitlist!',
      );
    } catch (err: unknown) {
      displayErrorWithTimeout('An unexpected error occured. Try again in a bit.');
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!user?.uid) return;
    displayLoading();
    try {
      const res = await removeUserFromEvent(eventId, user.uid);
      if (polling) {
        // refresh immediately to reflect changes
        refreshList();
      }
      displaySuccessWithTimeout(
        res === 'confirmed' ? 'You left the list.' : 'You left the waitlist.',
      );
    } catch (err: unknown) {
      displayErrorWithTimeout('An unexpected error occured. Try again in a bit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='mx-auto mb-4 md:mb-0 flex flex-col lg:flex-row lg:justify-evenly w-full md:w-[60%] lg:w-[80%] gap-2 lg:gap-4'>
      <EventInfo />

      <div className='border-t-1 border-gray-500/50 pt-10 lg:border-0 lg:pt-0 w-full xl:w-[80%] 2xl:w-[35%] h-full flex flex-col items-center'>
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
          <ShareButton onShare={handleShare} />
          <EventButton
            disabled={disableButton}
            handleFlowOpen={() => setShowWizard(true)}
            handleSignup={handleSignup}
            handleLeave={() => setConfirmLeave(true)}
          />
        </div>

        {/* Mobile fixed action button */}
        <div className='w-full fixed bottom-0 lg:hidden z-50'>
          <div className='w-full flex gap-4 justify-end pb-8 pr-6'>
            <ShareButton onShare={handleShare} />
            <EventButton
              disabled={disableButton}
              handleFlowOpen={() => setShowWizard(true)}
              handleSignup={handleSignup}
              handleLeave={() => setConfirmLeave(true)}
            />
          </div>
        </div>

        {/* Share feedback message */}
        <ShareFeedbackMessage message={shareMessage} />

        {/* Full-screen Overlays */}
        {loading && (
          <div className='fixed inset-0 flex items-center justify-center z-50 bg-white/60 dark:bg-black/60 backdrop-blur'>
            <Dots size={4} />
          </div>
        )}
        {error && (
          <div className='fixed inset-0 flex items-center justify-center z-50 bg-white/60 dark:bg-black/60 backdrop-blur'>
            <ErrorMessage size={'xl'} content={error} />
          </div>
        )}
        {successMessage && (
          <div className='fixed inset-0 flex items-center justify-center z-50 bg-white/60 dark:bg-black/60 backdrop-blur'>
            <p className='text-2xl font-bold'>{successMessage}</p>
          </div>
        )}
      </div>

      {/* Dialog for sign-up flow */}
      {showWizard && (
        <SignupFlow handleSignup={handleSignup} handleCancel={() => setShowWizard(false)} />
      )}

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
