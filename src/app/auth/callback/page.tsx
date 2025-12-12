'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Loading from '@/app/loading';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      // Parse session from URL
      await supabase.auth.getSession();

      // Redirect to original page
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get('redirect') ?? '/';
      router.replace(redirect);
    };

    handleAuth();
  }, [router]);

  return <Loading />;
}
