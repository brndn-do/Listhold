'use client';

import { useAuth } from '@/context/AuthProvider';
import { useEvent } from '@/context/EventProvider';
import { SignupData } from '@/services/fetchList';
import Image from 'next/image';
import { useState } from 'react';

interface ListItemProps {
  signup: SignupData;
  idx: number;
}

const ListItem = ({ signup, idx }: ListItemProps) => {
  const { user } = useAuth();
  const { capacity, prompts } = useEvent();

  const [showAnswers, setShowAnswers] = useState(false);

  const getDisplayOrder = (id: string) => {
    return prompts.findIndex((p) => p.id === id);
  };

  const orderedAnswers = Object.entries(signup.publicAnswers).sort(
    (a, b) => getDisplayOrder(a[0]) - getDisplayOrder(b[0]),
  );

  return (
    <li className='w-full flex flex-col gap-2 w-full px-2 border-b mb-1 border-dashed border-gray-700 dark:border-gray-500'>
      <div className='w-full flex items-center justify-between gap-2'>
        <div className='max-w-[80%] flex items-center gap-2'>
          <Image
            alt={`${signup.displayName}'s profile photo`}
            src={signup.avatarURL || '/default-avatar.jpg'}
            width={26}
            height={26}
            className={`border-2 border-purple-700 dark:border-purple-600 h-[26px] w-[26px] rounded-full`}
          ></Image>
          <p className={`${user?.uid === signup.userId ? 'text-purple-600 dark:text-purple-400 ' : ''}flex-1 whitespace-nowrap overflow-hidden text-ellipsis`}>
            {signup.displayName}
          </p>
          {orderedAnswers.length > 0 && (
            <div
              role='button'
              onClick={() => setShowAnswers(!showAnswers)}
              className='flex w-25 overflow-hidden items-center ml-1 gap-1 hover:cursor-pointer'
            >
              <p className='text-xs whitespace-nowrap text-gray-600 dark:text-gray-400'>
                {showAnswers ? 'Hide Answers' : 'Show Answers'}
              </p>
              <svg
                className={`shrink-0 -translate-y-[1px] w-4 h-4 text-gray-500 transition-transform duration-200 ${
                  showAnswers ? 'rotate-180' : ''
                } group-hover:text-gray-700 dark:group-hover:text-gray-300`}
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
        </div>
        <span className='text-purple-600 dark:text-purple-400 text-xs font-semibold'>
          {idx + 1}/{capacity}
        </span>
      </div>
      <div
        className={`grid transition-all duration-200 ${
          showAnswers && orderedAnswers.length > 0
            ? 'grid-rows-[1fr] mb-2.5'
            : 'grid-rows-[0fr]'
        }`}
      >
        <div className='overflow-hidden'>
          <ol className='flex flex-col gap-2'>
            {orderedAnswers.map(([promptId, answer]) => {
              const prompt = prompts.find((p) => p.id === promptId);
              if (!prompt) return null;

              return (
                <li
                  key={promptId}
                  className='bg-gray-100 dark:bg-gray-500/25 rounded-lg px-2.5 py-1 text-sm text-gray-600 dark:text-gray-300 flex justify-between gap-4'
                >
                  <span className='flex-1 text-gray-800 dark:text-gray-200 mr-1 whitespace-nowrap overflow-hidden text-ellipsis'>
                    {prompt.text}
                  </span>
                  <span className='max-w-[75%]'>
                    {typeof answer === 'boolean' ? (answer ? 'Yes' : 'No') : answer}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </li>
  );
};

export default ListItem;
