'use client';

import Link from 'next/link';

export default function ErrorPage() {
  return (
    <div className='flex flex-col items-center'>
      <h1 className='mb-2 text-4xl font-bold text-red-600 dark:text-red-400'>500 Server Error</h1>
      <h2 className=''>We are having trouble loading this event right now.</h2>
      <p className=''>Try again in about a minute.</p>
      <p className=''>
        You can check Supabase&apos;s status at{' '}
        <Link
          href='https://status.supabase.com/'
          target='_blank'
          rel='noopener noreferrer'
          className='text-blue-600 underline dark:text-blue-400'
        >
          status.supabase.com
        </Link>
      </p>
    </div>
  );
}
