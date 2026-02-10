import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Listhold',
  description: "Automate your event's signup list.",
};

const Home = () => {
  return (
    <div className='flex flex-col items-center'>
      <h1 className='bg-gradient-to-r from-slate-700 to-purple-800 bg-clip-text text-center text-5xl font-bold tracking-wider text-transparent dark:from-slate-300 dark:to-purple-600'>
        Listhold
      </h1>
      <p className='mt-4 text-center text-lg text-slate-700 dark:text-slate-400'>
        {'Manage your event lists with ease.'}
      </p>
    </div>
  );
};

export default Home;
