import Link from 'next/link';

const NotFound = () => {
  return (
    <div className='flex min-h-[60vh] flex-col items-center justify-center px-4'>
      <div className='flex flex-col items-center gap-2'>
        <h1 className='text-6xl font-bold'>404</h1>
        <h2 className='text-xl font-semibold text-gray-800 dark:text-gray-200'>Page Not Found</h2>
        <p className='text-gray-600 dark:text-gray-400'>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href='/'
          className='mt-2 inline-block rounded-xl bg-pink-500 px-6 py-[.5rem] text-white hover:cursor-pointer dark:bg-pink-500'
        >
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
