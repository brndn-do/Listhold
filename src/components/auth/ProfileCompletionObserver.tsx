'use client';

import { useAuth } from '@/context/AuthProvider';
import { useState, useEffect } from 'react';
import CompleteProfilePopup from './CompleteProfilePopup';

export default function ProfileCompletionObserver() {
  const { user, loading } = useAuth();
  const [showPopup, setShowPopup] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);

  useEffect(() => {
    // Only show if:
    // 1. Not loading
    // 2. User is logged in
    // 3. Profile is incomplete
    // 4. User has NOT dismissed it in this session
    if (!loading && user && !user.profileCompletedAt && !hasDismissed) {
      setShowPopup(true);
    } else {
      setShowPopup(false);
    }
  }, [user, loading, hasDismissed]);

  const handleClose = () => {
    setShowPopup(false);
    setHasDismissed(true);
  };

  if (!showPopup) {
    return null;
  }

  return <CompleteProfilePopup user={user} onClose={handleClose} />;
}
