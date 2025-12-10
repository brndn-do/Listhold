'use client';

import { useAuth } from '@/context/AuthProvider';
import { useEvent } from '@/context/EventProvider';
import { SignupData } from '@/types/signupData';
import { WithId } from '@/types/withId';
import { formatDate } from '@/utils/timeFormatter';
import Image from 'next/image';
import { useMemo, useState } from 'react';

interface ListItemProps {
  signup: WithId<SignupData>;
}

const ListItem = ({ signup }: ListItemProps) => {
  const { user } = useAuth();
  const { prompts } = useEvent();
  const { formattedDate, formattedTime } = formatDate(signup.signupTime);
  const [isExpanded, setIsExpanded] = useState(false);

  const publicAnswers = useMemo(() => {
    if (
      !signup.answers ||
      Object.keys(signup.answers).length === 0 ||
      Object.keys(prompts).length === 0
    ) {
      return [];
    }

    // Filter the user's answers
    return Object.entries(signup.answers)
      .map(([promptId, answer]) => {
        const prompt = prompts[promptId];
        // Return an object with all info needed for rendering
        return {
          promptId,
          order: prompt?.order,
          answer,
          text: prompt?.text,
          visibility: prompt?.visibility,
        };
      })
      .filter((p) => p.visibility === 'public' && p.answer !== null)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)); // sort by prompt order
  }, [signup.answers, prompts]);

  return (
    <li className='flex flex-col items-center w-[95%] pb-[1px] border-b border-dashed border-gray-700 dark:border-gray-500'>
      {/* Top view (always visible) */}
      <div className='flex items-center w-full gap-2'>
        <Image
          alt={`${signup.displayName}'s profile photo`}
          src={signup.photoURL || '/default-avatar.jpg'}
          width={26}
          height={26}
          className={`border-2 border-purple-700 dark:border-purple-600 h-[26px] w-[26px] rounded-full`}
        ></Image>
        <p className={user?.uid === signup.id ? 'text-purple-700 dark:text-purple-500' : ''}>
          {`${signup.displayName}`}
        </p>
        {publicAnswers.length > 0 && (
          <button
            className='opacity-65 cursor-pointer underline text-[.65rem] pt-[1px]'
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'close info' : 'show more info'}
          </button>
        )}
        <p className={`ml-auto text-[.65rem] text-right opacity-80`}>
          {formattedDate}
          <br />
          {formattedTime}
        </p>
      </div>

      {/* Expanded */}
      {isExpanded && (
        <div className='w-full'>
          <ul className='flex flex-col gap-1 my-1'>
            {publicAnswers.length > 0 &&
              publicAnswers.map(({ promptId, text, answer }) => (
                <li key={promptId} className='text-xs'>
                  {text}: {answer === true ? 'Yes' : answer === false ? 'No' : String(answer)}
                </li>
              ))}
          </ul>
        </div>
      )}
    </li>
  );
};

export default ListItem;
