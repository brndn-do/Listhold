'use client';

import { useEvent } from '@/context/EventProvider';
import ListItem from './ListItem';
import Dots from '@/components/ui/Dots';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { useRef, useState, useEffect } from 'react';

interface EventListProps {
  viewingWaitlist: boolean;
}

const EventList = ({ viewingWaitlist }: EventListProps) => {
  const { confirmedList, waitlist, listLoading, disconnected } = useEvent();
  const confirmedListRef = useRef<HTMLOListElement>(null);
  const waitlistRef = useRef<HTMLOListElement>(null);
  const [isConfirmedScrollable, setIsConfirmedScrollable] = useState(false);
  const [isWaitlistScrollable, setIsWaitlistScrollable] = useState(false);
  const [isConfirmedAtBottom, setIsConfirmedAtBottom] = useState(false);
  const [isWaitlistAtBottom, setIsWaitlistAtBottom] = useState(false);

  // Check if confirmed list is scrollable and at bottom
  useEffect(() => {
    const checkScrollable = () => {
      if (confirmedListRef.current) {
        const { scrollHeight, clientHeight, scrollTop } = confirmedListRef.current;
        setIsConfirmedScrollable(scrollHeight > clientHeight);
        setIsConfirmedAtBottom(scrollTop + clientHeight >= scrollHeight - 1);
      }
    };
    
    checkScrollable();
    
    const listElement = confirmedListRef.current;
    if (listElement) {
      listElement.addEventListener('scroll', checkScrollable);
    }
    window.addEventListener('resize', checkScrollable);
    
    return () => {
      if (listElement) {
        listElement.removeEventListener('scroll', checkScrollable);
      }
      window.removeEventListener('resize', checkScrollable);
    };
  }, [confirmedList]);

  // Check if waitlist is scrollable and at bottom
  useEffect(() => {
    const checkScrollable = () => {
      if (waitlistRef.current) {
        const { scrollHeight, clientHeight, scrollTop } = waitlistRef.current;
        setIsWaitlistScrollable(scrollHeight > clientHeight);
        setIsWaitlistAtBottom(scrollTop + clientHeight >= scrollHeight - 1);
      }
    };
    
    checkScrollable();
    
    const listElement = waitlistRef.current;
    if (listElement) {
      listElement.addEventListener('scroll', checkScrollable);
    }
    window.addEventListener('resize', checkScrollable);
    
    return () => {
      if (listElement) {
        listElement.removeEventListener('scroll', checkScrollable);
      }
      window.removeEventListener('resize', checkScrollable);
    };
  }, [waitlist]);

  // helper for rendering a list (confirmed or waitlist)
  const renderList = (list: typeof confirmedList, listRef: React.RefObject<HTMLOListElement | null>, isScrollable: boolean, isAtBottom: boolean) => {
    if (listLoading) {
      return (
        <div className='w-full flex justify-center mt-16'>
          <Dots size={3} />
        </div>
      );
    }

    if (list?.length === 0) {
      return (
        <div className='w-full flex justify-center mt-16'>
          <p className='font-bold'>No one yet...</p>
        </div>
      );
    }

    return (
      <>
        <ol ref={listRef} className='flex-1 flex flex-col items-center w-full overflow-y-auto scrollbar scrollbar-thin gap-1'>
          {list.map((signup, idx) => (
            <ListItem signup={signup} idx={idx} key={signup.id} />
          ))}
        </ol>
        {/* Down arrow indicator, conditionally rendered if the list is scrollable and not at bottom*/}
        {isScrollable && !isAtBottom && (
          <div className='absolute inset-0 flex flex-col justify-end items-center z-5 pb-4 pointer-events-none'>
            <svg
              className='w-6 h-6 text-white bg-black/50 dark:bg-gray-500/50 rounded-full animate-bounce scale-125'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
            </svg>
          </div>
        )}
      </>
    );
  };

  return (
    <div className='relative flex flex-col items-center w-full h-[60vh] border-1 border-gray-500 rounded-2xl py-2 px-1'>
      {/* Confirmed List */}
      <div
        className={`absolute inset-0 flex flex-col items-center py-2 px-1 transition-opacity duration-200 ${
          !viewingWaitlist
            ? disconnected
              ? 'opacity-30 z-10'
              : 'opacity-100 z-10'
            : 'opacity-0 z-0'
        }`}
      >
        {renderList(confirmedList, confirmedListRef, isConfirmedScrollable, isConfirmedAtBottom)}
      </div>

      {/* Waitlist */}
      <div
        className={`absolute inset-0 flex flex-col items-center py-2 px-1 transition-opacity duration-200 ${
          viewingWaitlist
            ? disconnected
              ? 'opacity-30 z-10'
              : 'opacity-100 z-10'
            : 'opacity-0 z-0'
        }`}
      >
        {renderList(waitlist, waitlistRef, isWaitlistScrollable, isWaitlistAtBottom)}
      </div>

      {disconnected && (
        <div className='absolute inset-0 z-[-1] flex items-center justify-center'>
          <div>
            <ErrorMessage content={'You are disconnected'} />
          </div>
        </div>
      )}
    </div>
  );
};

export default EventList;
