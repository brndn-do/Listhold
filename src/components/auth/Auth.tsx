'use client';

import { handleSignIn, handleSignOut, useAuth } from '@/context/AuthProvider';
import Image from 'next/image';
import Button from '../ui/Button';
import { saveUserDocument } from '@/services/userService';

const Auth = () => {
  const { user } = useAuth();

  const signIn = async () => {
    try {
      const user = await handleSignIn();
      await saveUserDocument(user);
    } catch (err) {
      console.error(err);
    }
  };

  const signOut = async () => {
    try {
      await handleSignOut();
    } catch (err) {
      console.error(err);
    }
  };

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
      <Button
        onClick={user ? signOut : signIn}
        content={user ? 'Sign out' : 'Sign in with Google'}
      />
    </div>
  );
};

export default Auth;
