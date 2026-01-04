'use client';

import { useAuth } from '@/context/AuthProvider';
import { useEvent } from '@/context/EventProvider';
import { SignupData } from '@/services/fetchList';
import Image from 'next/image';

interface ListItemProps {
  signup: SignupData;
  idx: number;
}

const ListItem = ({ signup, idx }: ListItemProps) => {
  const { user } = useAuth();
  const { capacity } = useEvent();

  return (
    <li className='flex items-center w-full px-2 pb-1.25 border-b border-dashed border-gray-700 dark:border-gray-500'>
      <div className='flex items-center justify-between w-full gap-2'>
        <div className='flex items-center gap-2'>
          <Image
            alt={`${signup.displayName}'s profile photo`}
            src={signup.avatarURL || '/default-avatar.jpg'}
            width={26}
            height={26}
            className={`border-2 border-purple-700 dark:border-purple-600 h-[26px] w-[26px] rounded-full`}
          ></Image>
          <p className={user?.uid === signup.userId ? 'text-purple-600 dark:text-purple-400' : ''}>
            {`${signup.displayName}`}
            {user?.uid === signup.userId && ' (You)'}
          </p>
        </div>
        <span className='text-purple-600 dark:text-purple-400 text-md font-semibold'>
          {idx+1}/{capacity}
        </span>
      </div>
    </li>
  );
};

export default ListItem;
