'use client';

import { useAuth } from '@/features/_shared/context/AuthProvider';
import { useState, useEffect } from 'react';
import CompleteProfilePopup from './CompleteProfilePopup';
import { usePathname } from 'next/navigation';

const ignoredPathNames = ['/profile', '/auth/callback'];

export default function ProfileCompletionObserver() {
  const pathName = usePathname();
  const { user, loading } = useAuth();
  const [showPopup, setShowPopup] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);

  useEffect(() => {
    const isIgnored = ignoredPathNames.some(
      (ignored) => pathName === ignored || pathName.startsWith(`${ignored}/`),
    );

    // Only show if:
    // 1. Not loading
    // 2. User is logged in
    // 3. Profile is incomplete
    // 4. User has NOT dismissed it in this session
    // 5. Not on an ignored page
    if (!isIgnored && !loading && user && !user.profileCompletedAt && !hasDismissed) {
      setShowPopup(true);
    } else {
      setShowPopup(false);
    }
  }, [pathName, user, loading, hasDismissed]);

  const handleClose = () => {
    setShowPopup(false);
    setHasDismissed(true);
  };

  if (!showPopup) {
    return null;
  }

  return <CompleteProfilePopup user={user} onClose={handleClose} />;
}
