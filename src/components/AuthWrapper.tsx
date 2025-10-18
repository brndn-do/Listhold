'use client';

import { signInWithPopup, signOut } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import Auth from './Auth';
import { GoogleAuthProvider } from 'firebase/auth';

const AuthWrapper = () => {
  const [user] = useAuthState(auth);

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    }
    catch (err) {
      console.error(err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    }
    catch (err) {
      console.error(err);
    }
  };

  const authComponentUser = user
    ? { uid: user.uid, displayName: user.displayName || 'User', email: user.email || '' }
    : undefined;

  return <Auth user={authComponentUser} onSignIn={handleSignIn} onSignOut={handleSignOut} />;
};

export default AuthWrapper;
