'use client';

import { useAuth } from '@/context/AuthProvider';
import { SignupData } from '@/services/fetchInitialList';
import { formatDate } from '@/utils/timeFormatter';
import Image from 'next/image';

interface ListItemProps {
  signup: SignupData;
}

const ListItem = ({ signup }: ListItemProps) => {
  const { user } = useAuth();
  const { formattedDate, formattedTime } = formatDate(signup.createdAt);

  return (
    <li className='flex flex-col items-center w-[95%] pb-[1px] border-b border-dashed border-gray-700 dark:border-gray-500'>
      <div className='flex items-center w-full gap-2'>
        <Image
          alt={`${signup.displayName}'s profile photo`}
          src={signup.avatarURL || '/default-avatar.jpg'}
          width={26}
          height={26}
          className={`border-2 border-purple-700 dark:border-purple-600 h-[26px] w-[26px] rounded-full`}
        ></Image>
        <p className={user?.uid === signup.userId ? 'text-purple-700 dark:text-purple-500' : ''}>
          {`${signup.displayName}`}
        </p>
        <p className={`ml-auto text-[.65rem] text-right opacity-80`}>
          {formattedDate}
          <br />
          {formattedTime}
        </p>
      </div>
    </li>
  );
};

export default ListItem;
