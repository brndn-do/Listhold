import { useAuth } from '@/context/AuthProvider';
import { SignupData } from '@/types';
import { formatTimestamp } from '@/utils/timeFormatter';
import Image from 'next/image';

interface ListItemProps {
  signup: SignupData;
}

const ListItem = ({ signup }: ListItemProps) => {
  const { user } = useAuth();
  const { formattedDate, formattedTime } = formatTimestamp(signup.signupTime);
  return (
    <li className='flex items-center w-[95%] gap-2 pb-[1px] border-b border-dashed border-gray-700 dark:border-gray-500'>
      <Image
        alt='Your profile photo'
        src={signup.photoURL || '/default-avatar.jpg'}
        width={26}
        height={26}
        className={`border-2 border-purple-700 dark:border-purple-600 h-[26px] w-[26px] rounded-full`}
      ></Image>
      <p className={user?.uid === signup.id ? 'text-purple-700 dark:text-purple-500' : ''}>
        {`${signup.displayName}`}
      </p>
      <p className={`ml-auto text-[.65rem] text-right opacity-80`}>
        {formattedDate}
        <br />
        {formattedTime}
      </p>
    </li>
  );
};

export default ListItem;
