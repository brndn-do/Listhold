'use client';

import Link from 'next/link';
import SpotsCounter from '@/components/event/SpotsCounter';
import EventTime from '@/components/event/EventTime';
import { useEvent } from '@/context/EventProvider';

const EventInfo = () => {
  const { name, orgSlug, orgName, start, end, location, capacity, description } = useEvent();

  return (
    <div className='w-full lg:max-w-[50%]'>
      <div className='flex flex-col gap-2 pb-2 px-2'>
        {/* Header Section */}
        <div>
          <h1 className='text-4xl md:text-5xl xl:text-6xl text-gray-800 dark:text-foreground font-bold mb-2'>{name}</h1>
          {orgSlug && (
            <div className='flex'>
              <Link
                href={`/organizations/${orgSlug}`}
                className='inline-flex items-center gap-1 font-semibold text-purple-600 dark:text-purple-400 hover:translate-y-[-2px] transition-all duration-300'
              >
                <span className='underline'>{orgName}</span>
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 5l7 7-7 7'
                  />
                </svg>
              </Link>
            </div>
          )}
        </div>

        {/* Time Section */}
        <div className='pl-1'>
          <div className='flex items-center gap-2 text-gray-800 dark:text-gray-300'>
            <svg
              className='w-5 h-5 flex-shrink-0 text-purple-600 dark:text-purple-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
              />
            </svg>
            <EventTime start={start} end={end} />
          </div>
        </div>

        {/* Location Section */}
        <div className='pl-1'>
          <div className='flex items-center gap-2 text-gray-800 dark:text-gray-300'>
            <svg
              className='w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
              />
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
              />
            </svg>
            <p>{location}</p>
          </div>
        </div>

        {/* Capacity Section */}
        <div className='pl-1'>
          <div className='flex items-center gap-2'>
            <svg
              className='w-5 h-5 flex-shrink-0 text-purple-600 dark:text-purple-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
              />
            </svg>
            <SpotsCounter capacity={capacity} />
          </div>
        </div>

        {/* Description Section */}
        {description && description.length > 0 && (
          <div className='mt-4 flex max-h-80 overflow-y-auto'>
            <p className='text-gray-800 dark:text-gray-300'>{description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventInfo;
