import Image from 'next/image';

interface AuthProps {
  user?: {
    uid: string;
    displayName: string;
    email: string;
    photoURL: string;
  };
  // eslint-disable-next-line
  onSignIn: (...args: any[]) => unknown | Promise<unknown>;
  // eslint-disable-next-line
  onSignOut: (...args: any[]) => unknown | Promise<unknown>;
}

const Auth = ({ user, onSignIn, onSignOut }: AuthProps) => {
  return (
    <div className='flex items-center gap-3 h-8'>
      {user ? (
        <>
          <Image
            alt='Your profile photo'
            src={user.photoURL || '/default-avatar.jpg'}
            width={32}
            height={32}
            className='h-8 w-8 rounded-full border-2 border-purple-700 dark:border-purple-600'
          ></Image>
          <h2 className='text-lg'>{user.displayName}</h2>
        </>
      ) : (
        <></>
      )}
      <button
        type='button'
        onClick={user ? onSignOut : onSignIn}
        className='text-sm text-white bg-purple-700 hover:bg-purple-800 font-medium rounded-lg text-sm px-3.5 py-2 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900 hover:cursor-pointer'
      >
        {user ? 'Sign out' : 'Sign in with Google'}
      </button>
    </div>
  );
};

export default Auth;
