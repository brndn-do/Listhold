'use client';

import { auth } from '@/lib/firebase';
import { saveUserDocument } from '@/services/userService';
import { signInWithPopup, signOut, User, GoogleAuthProvider } from 'firebase/auth';
import { createContext, ReactNode, useContext } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';

interface AuthContextType {
  user: User | null | undefined;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, loading] = useAuthState(auth);
  const value = { user, loading };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const handleSignIn = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    const result = await signInWithPopup(auth, provider);
    await saveUserDocument(result);
  } catch (err) {
    console.error(err);
  }
};

export const handleSignOut = async () => {
  try {
    await signOut(auth);
  } catch (err) {
    console.error(err);
  }
};
