'use client';

import { useRef, useState, useEffect } from 'react';
import { useAuth } from '@/features/_shared/context/AuthProvider';
import { signInWithGoogle, signOut } from '@/features/_shared/api/auth-service';
import Button from '@/features/_shared/components/ui/Button';
import InlineError from '@/features/_shared/components/ui/InlineError';
import Avatar from '@/features/_shared/components/ui/Avatar';
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
    <div className='relative flex h-8 items-center gap-4' ref={dropdownRef}>
      {!user && !error && (
        <Button onClick={handleSignIn} content={'Sign in with Google'} disabled={loading} />
      )}
      {error && <InlineError content={'Try again.'} />}
      {user && (
        <>
          <div
            onClick={() => setIsOpen(!isOpen)}
            className='relative cursor-pointer transition-opacity hover:opacity-70'
            role='button'
          >
            <Avatar
              alt='Your profile photo'
              src={user.avatarURL}
              size={32}
              className='h-10 w-10 border-2'
            />
            <div className='absolute -right-1.5 -bottom-1 rounded-full border border-purple-700 bg-gray-100 dark:border-0'>
              <ChevronDown className='h-5 w-5 text-purple-700' strokeWidth={2} />
            </div>
          </div>

          {isOpen && (
            <div className='bg-background absolute top-12 right-0 z-50 flex w-48 flex-col overflow-hidden rounded-xl border-2 border-gray-200 py-1 dark:border-gray-700'>
              {pathname != '/profile' && (
                <Link
                  href='/profile'
                  className='border-b border-gray-200 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800'
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
                className='w-full px-4 py-2.5 text-left text-sm text-red-600 transition-colors hover:cursor-pointer hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
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
