import { Metadata } from 'next';
import Link from 'next/link';

export const revalidate = false;

export const metadata: Metadata = {
  title: 'Rosterize',
  description: 'Automate event signups, rosters, and waitlists.',
};

const Home = () => {
  return (
    <div className='flex flex-col items-center'>
      <h1 className='text-5xl font-bold tracking-wider text-center text-transparent bg-clip-text bg-gradient-to-r to-purple-800 dark:to-purple-600 from-slate-700 dark:from-slate-300'>
        Rosterize
      </h1>
      <p className='mt-4 text-lg text-center text-slate-700 dark:text-slate-400'>
        {"Manage your organization's event rosters—with ease."}
      </p>
      <Link
        href='/organizations/new'
        className='mt-4 text-lg text-center text-purple-700 dark:text-purple-500 underline'
      >
        Create an organization to get started.
      </Link>
    </div>
  );
};

export default Home;
