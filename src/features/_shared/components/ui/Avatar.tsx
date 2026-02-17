'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { processAvatarUrl } from '@/features/_shared/utils/avatarUtils';

interface AvatarProps {
  src?: string | null;
  alt: string;
  size: number;
  className?: string;
  priority?: boolean;
}

const Avatar = ({ src, alt, size, className = '', priority = false }: AvatarProps) => {
  // Determine best size to request (2x for retina)
  const requestSize = size * 2;
  const [errored, setErrored] = useState(false);
  const processedSrc = useMemo(() => processAvatarUrl(src, requestSize), [src, requestSize]);
  const imgSrc = errored ? '/default-avatar.jpg' : processedSrc;

  // Reset fallback state when the source changes.
  useEffect(() => {
    setErrored(false);
  }, [processedSrc]);

  return (
    <Image
      alt={alt}
      src={imgSrc}
      width={size}
      height={size}
      priority={priority}
      unoptimized={imgSrc.includes('googleusercontent.com') || imgSrc === '/default-avatar.jpg'}
      className={`rounded-full border-purple-700 dark:border-purple-600 ${className}`}
      onError={() => setErrored(true)}
    />
  );
};

export default Avatar;
