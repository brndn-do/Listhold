import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <main className='p-16 flex flex-col items-center justify-center'>
      <h1 className='text-5xl font-bold tracking-wider text-center text-transparent bg-clip-text bg-gradient-to-r to-purple-800 from-slate-200'>
        Rosterize
      </h1>
      <p className='mt-4 text-lg text-center text-slate-600'>
        Manage your event rosters with ease.
      </p>
      <Link href='/events/nuarchery-10-24' className='mt-4 text-lg text-center text-slate-200 underline'>Friday Practice</Link>
    </main>
  );
}
