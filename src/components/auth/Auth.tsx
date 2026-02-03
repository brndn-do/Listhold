'use client';

import { useRef, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { signInWithGoogle, signOut } from '@/services/authService';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import Avatar from '@/components/ui/Avatar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

const ERROR_TIME = 3000;

const Auth = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    <div className='flex items-center gap-4 h-8 relative' ref={dropdownRef}>
      {!user && !error && (
        <Button onClick={handleSignIn} content={'Sign in with Google'} disabled={loading} />
      )}
      {error && <ErrorMessage content={'Try again.'} />}
      {user && (
        <>
          <div
            onClick={() => setIsOpen(!isOpen)}
            className='relative cursor-pointer hover:opacity-70 transition-opacity'
            role='button'
          >
            <Avatar
              alt='Your profile photo'
              src={user.avatarURL}
              size={32}
              className='h-10 w-10 border-2'
            />
            <div className='absolute -bottom-1 -right-1.5 bg-gray-100 border border-purple-700 dark:border-0 rounded-full'>
              <ChevronDown className='w-5 h-5 text-purple-700' strokeWidth={2} />
            </div>
          </div>

          {isOpen && (
            <div className='absolute top-12 right-0 w-48 rounded-xl bg-background border-2 border-gray-200 dark:border-gray-700 py-1 overflow-hidden z-50 flex flex-col'>
              {pathname != '/profile' && (
                <Link
                  href='/profile'
                  className='px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 border-b border-gray-200 dark:border-gray-800 transition-colors text-left'
                  onClick={() => setIsOpen(false)}
                >
                  Edit Profile
                </Link>
              )}
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleSignOut();
                }}
                disabled={loading}
                className='px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left w-full hover:cursor-pointer'
              >
                Sign out
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Auth;
