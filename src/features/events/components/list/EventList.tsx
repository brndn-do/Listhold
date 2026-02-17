'use client';

import { useEvent } from '@/features/events/context/EventProvider';
import { useScrollState } from '@/features/events/hooks/useScrollState';
import ListItem from './ListItem';
import LoadingDots from '@/features/_shared/components/ui/LoadingDots';
import InlineError from '@/features/_shared/components/ui/InlineError';
import { useRef } from 'react';

interface EventListProps {
  viewingWaitlist: boolean;
}

const EventList = ({ viewingWaitlist }: EventListProps) => {
  const { confirmedList, waitlist, listLoading, disconnected } = useEvent();
  const confirmedListRef = useRef<HTMLOListElement>(null);
  const waitlistRef = useRef<HTMLOListElement>(null);

  // check if main list is scrollable via hook
  const { isScrollable: isConfirmedScrollable, isAtBottom: isConfirmedAtBottom } = useScrollState(
    confirmedListRef,
    confirmedList,
  );

  // check if waitlist is scrollable via hook
  const { isScrollable: isWaitlistScrollable, isAtBottom: isWaitlistAtBottom } = useScrollState(
    waitlistRef,
    waitlist,
  );

  // helper for rendering a list (confirmed or waitlist)
  const renderList = (
    list: typeof confirmedList,
    listRef: React.RefObject<HTMLOListElement | null>,
    isWaitlist: boolean,
    isScrollable: boolean,
    isAtBottom: boolean,
  ) => {
    if (listLoading) {
      return (
        <div className='mt-16 flex w-full justify-center'>
          <LoadingDots size={3} />
        </div>
      );
    }

    if (list?.length === 0) {
      return (
        <div className='mt-16 flex w-full justify-center'>
          <p className='font-bold'>No one yet...</p>
        </div>
      );
    }

    return (
      <>
        <ol
          ref={listRef}
          className='flex w-full flex-1 flex-col items-center gap-1 overflow-y-auto'
        >
          {list.map((signup, idx) => (
            <ListItem signup={signup} idx={idx} isWaitlist={isWaitlist} key={signup.id} />
          ))}
        </ol>
        {/* Down arrow indicator, conditionally rendered if the list is scrollable and not at bottom*/}
        {isScrollable && !isAtBottom && (
          <div className='pointer-events-none absolute inset-0 z-5 flex flex-col items-center justify-end pb-4'>
            <svg
              className='h-6 w-6 scale-125 animate-bounce rounded-full bg-black/50 text-white dark:bg-gray-500/50'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 9l-7 7-7-7'
              />
            </svg>
          </div>
        )}
      </>
    );
  };

  return (
    <div className='relative flex h-[60vh] w-full flex-col items-center rounded-2xl border-1 border-gray-500 px-1 py-2'>
      {/* Confirmed List */}
      <div
        className={`absolute inset-0 flex flex-col items-center px-1 py-2 transition-opacity duration-200 ${
          !viewingWaitlist
            ? disconnected
              ? 'z-10 opacity-30'
              : 'z-10 opacity-100'
            : 'z-0 opacity-0'
        }`}
      >
        {renderList(
          confirmedList,
          confirmedListRef,
          false,
          isConfirmedScrollable,
          isConfirmedAtBottom,
        )}
      </div>

      {/* Waitlist */}
      <div
        className={`absolute inset-0 flex flex-col items-center px-1 py-2 transition-opacity duration-200 ${
          viewingWaitlist
            ? disconnected
              ? 'z-10 opacity-30'
              : 'z-10 opacity-100'
            : 'z-0 opacity-0'
        }`}
      >
        {renderList(waitlist, waitlistRef, true, isWaitlistScrollable, isWaitlistAtBottom)}
      </div>

      {disconnected && (
        <div className='absolute inset-0 z-[-1] flex items-center justify-center'>
          <div>
            <InlineError content={'You are disconnected'} />
          </div>
        </div>
      )}
    </div>
  );
};

export default EventList;
