import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Listhold',
  description: "Automate your event's signup list.",
};

const Home = () => {
  return (
    <div className='flex flex-col items-center'>
      <h1 className='text-5xl font-bold tracking-wider text-center text-transparent bg-clip-text bg-gradient-to-r to-purple-800 dark:to-purple-600 from-slate-700 dark:from-slate-300'>
        Listhold
      </h1>
      <p className='mt-4 text-lg text-center text-slate-700 dark:text-slate-400'>
        {'Manage your event lists with ease.'}
      </p>
    </div>
  );
};

export default Home;
