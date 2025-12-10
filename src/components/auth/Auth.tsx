'use client';

import { useState } from 'react';
import { handleSignIn, handleSignOut, useAuth } from '@/context/AuthProvider';
import { saveUser } from '@/services/saveUser';
import Image from 'next/image';
import Button from '@/components/ui/Button';

const Auth = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    setLoading(true);
    try {
      const user = await handleSignIn();
      // save most recent user data to database
      await saveUser(user);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await handleSignOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex flex-col items-center gap-1'>
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
          disabled={loading}
        />
      </div>
    </div>
  );
};

export default Auth;
