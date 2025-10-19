'use client';

import { signInWithPopup, signOut } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import Auth from './Auth';
import { GoogleAuthProvider } from 'firebase/auth';
import { saveUserDocument } from '@/services/userService';

const AuthWrapper = () => {
  const [user] = useAuthState(auth);

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const userData = {
        uid: result.user.uid,
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
      };
      await saveUserDocument(userData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  };

  const userData = user
    ? {
        uid: user.uid,
        displayName: user.displayName || 'User',
        email: user.email || '',
        photoURL: user.photoURL || '/default-avatar.png',
      }
    : undefined;

  return <Auth user={userData} onSignIn={handleSignIn} onSignOut={handleSignOut} />;
};

export default AuthWrapper;
