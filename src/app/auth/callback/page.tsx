'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '@/app/loading';
import { getSession } from '@/services/authService';

const AuthCallback = () => {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      // Store session
      await getSession();

      // Redirect to original page
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get('redirect') ?? '/';
      router.replace(redirect);
    };

    handleAuth();
  }, [router]);

  return <Loading />;
};

export default AuthCallback;
