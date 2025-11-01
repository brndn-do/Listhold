import { useAuth } from '@/context/AuthProvider';
import { SignupData } from '@/types';

interface EventListProps {
  signups: SignupData[];
}

const EventList = ({ signups }: EventListProps) => {
  const { user } = useAuth();
  return (
    <div className='flex flex-col items-center w-full h-full'>
      <ol className='flex-1 flex flex-col w-full overflow-y-auto scrollbar scrollbar-thin items-center list-decimal list-inside'>
        {signups.map((signup) => (
          <li
            className={user?.uid === signup.uid ? 'text-purple-700 dark:text-purple-600' : ''}
            key={signup.uid}
          >{`${signup.displayName}`}</li>
        ))}
        {[
          1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
          26, 27, 28, 29, 30,
        ].map((num) => (
          <li key={num}>{`Salvador Lance Lopez`}</li>
        ))}
        {Array.from({ length: 15 }, (_, i) => `Hidden ${i + 1}`).map((str) => (
          <li aria-hidden='true' className='opacity-0' key={str}></li>
        ))}
      </ol>
      {/* gradient fade hint */}
      <div className='pointer-events-none absolute top-0 p-2 w-full h-[5%] bg-gradient-to-b from-[#f6f6f6ff] dark:from-[#191919] to-transparent rounded-t-2xl' />
      {/* gradient fade hint */}
      <div className='pointer-events-none absolute bottom-0 p-2 w-full h-[30%] bg-gradient-to-t from-[#f6f6f6ff] dark:from-[#191919] to-transparent rounded-b-2xl' />
    </div>
  );
};

export default EventList;
