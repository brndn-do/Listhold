'use client';

import EventInfo from './EventInfo';
import { useAuth } from '@/features/_shared/context/AuthProvider';
import { useEvent } from '@/features/events/context/EventProvider';
import { useState } from 'react';
import EventList from '@/features/events/components/list/EventList';
import EventButton from '@/features/events/components/EventButton';
import SignupFlow from '@/features/events/components/signup/SignupWizard';
import { addUserToEvent } from '@/features/events/api/add-user-to-event';
import { removeUserFromEvent } from '@/features/events/api/remove-user-from-event';
import LoadingDots from '@/features/_shared/components/ui/LoadingDots';
import InlineError from '@/features/_shared/components/ui/InlineError';
import Button from '@/features/_shared/components/ui/Button';
import ShareButton from '@/features/events/components/ShareButton';
import ShareFeedbackMessage from '@/features/events/components/ShareFeedbackMessage';

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
    <div className='mx-auto mb-4 flex w-full flex-col gap-2 md:mb-0 md:w-[60%] lg:w-[80%] lg:flex-row lg:justify-evenly lg:gap-4'>
      <EventInfo />

      <div className='flex h-full w-full flex-col items-center border-t-1 border-gray-500/50 pt-10 lg:border-0 lg:pt-0 xl:w-[80%] 2xl:w-[35%]'>
        <div className='mb-3 w-full'>
          {/* Header */}
          <h1 className='text-center text-2xl font-bold text-gray-900 dark:text-gray-100'>
            Signups
          </h1>

          {/* Tabs */}
          <div className='mx-auto flex w-[90%]'>
            <button
              onClick={() => setViewingWaitlist(false)}
              className={`border-background transition-color flex-1 border-b-2 px-6 py-2 text-sm font-semibold duration-200 ${
                !viewingWaitlist
                  ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                  : 'text-gray-600 hover:cursor-pointer hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Confirmed
            </button>
            <button
              onClick={() => setViewingWaitlist(true)}
              className={`border-background transition-color flex-1 border-b-2 px-6 py-2 text-sm font-semibold duration-200 ${
                viewingWaitlist
                  ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                  : 'text-gray-600 hover:cursor-pointer hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
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
        <div className='hidden w-full justify-end gap-4 pr-6 lg:flex'>
          <ShareButton onShare={handleShare} />
          <EventButton
            disabled={disableButton}
            handleFlowOpen={() => setShowWizard(true)}
            handleSignup={handleSignup}
            handleLeave={() => setConfirmLeave(true)}
          />
        </div>

        {/* Mobile fixed action button */}
        <div className='fixed bottom-0 z-50 w-full lg:hidden'>
          <div className='flex w-full justify-end gap-4 pr-6 pb-8'>
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
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur dark:bg-black/60'>
            <LoadingDots size={4} />
          </div>
        )}
        {error && (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur dark:bg-black/60'>
            <InlineError size={'xl'} content={error} />
          </div>
        )}
        {successMessage && (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur dark:bg-black/60'>
            <p className='text-2xl font-bold'>{successMessage}</p>
          </div>
        )}
      </div>

      {/* Dialog for sign-up flow */}
      {showWizard && (
        <SignupFlow handleSignup={handleSignup} handleCancel={() => setShowWizard(false)} />
      )}

      {confirmLeave && (
        <div className='fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-white/60 backdrop-blur dark:bg-black/60'>
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
