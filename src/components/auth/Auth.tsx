'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { signInWithGoogle, signOut } from '@/services/authService';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';

const ERROR_TIME = 3000;

const Auth = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleSignIn = () => {
    signInWithGoogle();
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
    } catch {
      setError(true);
      setTimeout(() => {
        setError(false);
      }, ERROR_TIME);
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className='flex items-center gap-4 h-8'>
        {!error && (
          <Button
          onClick={user? handleSignOut : handleSignIn}
          content={user ? 'Sign out' : 'Sign in with Google'}
          disabled={loading}
          />
        )}
        {error && <ErrorMessage content={'Try again.'} />}
        {user && (
          <Image
            alt='Your profile photo'
            src={user.avatarURL || '/default-avatar.jpg'}
            width={32}
            height={32}
            className='h-8 w-8 rounded-full border-2 border-purple-700 dark:border-purple-600'
          ></Image>
        )}
      </div>
  );
};

export default Auth;
