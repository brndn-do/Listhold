import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <main className='py-16 px-4 flex flex-col items-center justify-center'>
      <h1 className='text-5xl font-bold tracking-wider text-center text-transparent bg-clip-text bg-gradient-to-r to-purple-800 dark:to-purple-600 from-slate-700 dark:from-slate-300'>
        Rosterize
      </h1>
      <p className='mt-4 text-lg text-center text-slate-700 dark:text-slate-400'>
        {'Manage your organization\'s event rosters—with ease.'}
      </p>
      <Link
        href='/organizations/new'
        className='mt-4 text-lg text-center text-purple-700 dark:text-purple-500 underline'
      >
        Create an organization to get started.
      </Link>
    </main>
  );
}
