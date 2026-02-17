'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '@/app/loading';
import { loadSession } from '@/features/_shared/api/auth-service';

const AuthCallback = () => {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      // Store session
      await loadSession();

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
