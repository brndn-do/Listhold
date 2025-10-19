interface AuthProps {
  user?: {
    uid: string;
    displayName: string;
    email: string;
  };
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSignIn: (...args: any[]) => unknown | Promise<unknown>;
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSignOut: (...args: any[]) => unknown | Promise<unknown>;
}

const Auth = ({ user, onSignIn, onSignOut }: AuthProps) => {
  return (
    <div className='flex items-center gap-4'>
      <h2 className='text-xl text-gray-800 dark:text-gray-100'>
        {user ? `Hi, ${user.displayName}` : ''}
      </h2>
      <button
        type='button'
        onClick={user ? onSignOut : onSignIn}
        className='focus:outline-none text-[1rem] text-white bg-purple-700 hover:bg-purple-800 font-medium rounded-lg text-sm px-5 py-2 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900 hover:cursor-pointer'
      >
        {user ? 'Sign out' : 'Sign in with Google'}
      </button>
    </div>
  );
};

export default Auth;
