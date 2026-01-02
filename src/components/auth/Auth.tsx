'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { signInWithGoogle, signOut } from '@/services/authService';
import { saveProfile } from '@/services/saveProfile';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';

const ERROR_TIME = 3000;

const Auth = () => {
  const { user } = useAuth();
  const [profileSaved, setProfileSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // save the user to the database once, when authenticated
  useEffect(() => {
    if (user && !profileSaved) {
      saveProfile(user);
      setProfileSaved(true);
    }
  }, [user, profileSaved]);

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
    <div className='flex flex-col items-center gap-1'>
      <div className='flex items-center gap-6 h-8'>
        {!error && (
          <Button
          onClick={user? handleSignOut : handleSignIn}
          content={user ? 'Sign out' : 'Sign in'}
          disabled={loading}
          />
        )}
        {error && <ErrorMessage content={'Try again.'} />}
        {user && (
          <Image
            alt='Your profile photo'
            src={user.photoURL || '/default-avatar.jpg'}
            width={32}
            height={32}
            className='h-8 w-8 rounded-full border-2 border-purple-700 dark:border-purple-600'
          ></Image>
        )}
      </div>
    </div>
  );
};

export default Auth;
