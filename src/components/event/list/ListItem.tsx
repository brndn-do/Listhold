'use client';

import { useAuth } from '@/context/AuthProvider';
import { useEvent } from '@/context/EventProvider';
import { SignupData } from '@/services/fetchList';
import { Lock } from 'lucide-react';
import { useState } from 'react';
import Avatar from '@/components/ui/Avatar';

interface ListItemProps {
  signup: SignupData;
  idx: number;
  isWaitlist: boolean;
}

const ListItem = ({ signup, idx, isWaitlist }: ListItemProps) => {
  const { user } = useAuth();
  const { capacity, prompts } = useEvent();

  const getDisplayOrder = (id: string) => {
    return prompts.findIndex((p) => p.id === id);
  };

  const [showAnswers, setShowAnswers] = useState(false);

  const orderedAnswers = Object.entries(signup.answers).sort(
    (a, b) => getDisplayOrder(a[0]) - getDisplayOrder(b[0]),
  );

  return (
    <li className='mb-1 flex w-full flex-col gap-2 border-b border-dashed border-gray-700 px-2 dark:border-gray-500'>
      <div className='flex w-full items-center justify-between gap-2'>
        <div className='flex max-w-[90%] items-center'>
          <Avatar
            alt={`${signup.displayName}'s profile photo`}
            src={signup.avatarURL}
            size={26}
            className={`h-[22px] w-[22px] border-1 md:h-[26px] md:w-[26px] md:border-[1.5px]`}
          />
          {orderedAnswers.length === 0 && (
            <p
              className={`${user?.uid === signup.userId ? 'text-purple-600 dark:text-purple-400' : ''}ml-1.5 flex-1 overflow-hidden text-sm text-ellipsis whitespace-nowrap md:ml-2 md:text-[1rem]`}
            >
              {signup.displayName}
            </p>
          )}
          {orderedAnswers.length > 0 && (
            <div
              role='button'
              onClick={() => setShowAnswers(!showAnswers)}
              className='ml-1 flex items-center gap-1 hover:cursor-pointer'
            >
              <p
                className={`${user?.uid === signup.userId ? 'text-purple-600 dark:text-purple-400' : ''}ml-1.5 flex-1 overflow-hidden text-sm text-ellipsis whitespace-nowrap md:ml-2 md:text-[1rem]`}
              >
                {signup.displayName}
              </p>
              <svg
                className={`h-4 w-4 shrink-0 text-gray-600 transition-transform duration-200 md:h-4.5 md:w-4.5 dark:text-gray-400 ${
                  showAnswers ? 'rotate-180' : ''
                }`}
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
        <span className='text-[0.7rem] font-semibold text-purple-600 md:text-xs dark:text-purple-400'>
          {isWaitlist ? idx + 1 : `${idx + 1}/${capacity}`}
        </span>
      </div>
      <div
        className={`grid transition-all duration-200 ${
          showAnswers && orderedAnswers.length > 0 ? 'mb-2.5 grid-rows-[1fr]' : 'grid-rows-[0fr]'
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
                  className='flex justify-between gap-4 rounded-lg bg-gray-100 px-2.5 py-1 text-xs text-gray-600 md:text-sm dark:bg-gray-500/25 dark:text-gray-300'
                >
                  <span className='mr-1 flex min-w-0 flex-1 items-center gap-1.5 text-gray-800 dark:text-gray-200'>
                    {prompt.private && (
                      <Lock className='h-3 w-3 shrink-0 text-purple-600 dark:text-purple-400' />
                    )}
                    <span className='truncate'>{prompt.text}</span>
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
