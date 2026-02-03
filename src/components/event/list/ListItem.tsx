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
    <li className='mb-1 w-full flex flex-col gap-2 w-full px-2 border-b border-dashed border-gray-700 dark:border-gray-500'>
      <div className='w-full flex items-center justify-between gap-2'>
        <div className='max-w-[90%] flex items-center'>
          <Avatar
            alt={`${signup.displayName}'s profile photo`}
            src={signup.avatarURL}
            size={26}
            className={`border-1 md:border-[1.5px] h-[22px] w-[22px] md:h-[26px] md:w-[26px]`}
          />
          {orderedAnswers.length === 0 && (
            <p
              className={`${user?.uid === signup.userId ? 'text-purple-600 dark:text-purple-400 ' : ''}ml-1.5 md:ml-2 text-sm md:text-[1rem] flex-1 whitespace-nowrap overflow-hidden text-ellipsis`}
            >
              {signup.displayName}
            </p>
          )}
          {orderedAnswers.length > 0 && (
            <div
              role='button'
              onClick={() => setShowAnswers(!showAnswers)}
              className='ml-1 flex gap-1 items-center hover:cursor-pointer'
            >
              <p
                className={`${user?.uid === signup.userId ? 'text-purple-600 dark:text-purple-400 ' : ''}ml-1.5 md:ml-2 text-sm md:text-[1rem] flex-1 whitespace-nowrap overflow-hidden text-ellipsis`}
              >
                {signup.displayName}
              </p>
              <svg
                className={`shrink-0 w-4 h-4 md:w-4.5 md:h-4.5 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${
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
        <span className='text-purple-600 dark:text-purple-400 text-[0.7rem] md:text-xs font-semibold'>
          {isWaitlist ? idx + 1 : `${idx + 1}/${capacity}`}
        </span>
      </div>
      <div
        className={`grid transition-all duration-200 ${
          showAnswers && orderedAnswers.length > 0 ? 'grid-rows-[1fr] mb-2.5' : 'grid-rows-[0fr]'
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
                  className='bg-gray-100 dark:bg-gray-500/25 rounded-lg px-2.5 py-1 text-xs md:text-sm text-gray-600 dark:text-gray-300 flex justify-between gap-4'
                >
                  <span className='flex-1 text-gray-800 dark:text-gray-200 mr-1 flex items-center gap-1.5 min-w-0'>
                    {prompt.private && (
                      <Lock className='w-3 h-3 text-purple-600 dark:text-purple-400 shrink-0' />
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
