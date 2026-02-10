'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { processAvatarUrl } from '@/utils/avatarUtils';

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
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  useEffect(() => {
    setImgSrc(processAvatarUrl(src, requestSize));
  }, [src, requestSize]);

  if (!imgSrc) {
    return null;
  }

  return (
    <>
      <Image
        alt={alt}
        src={imgSrc}
        width={size}
        height={size}
        priority={priority}
        unoptimized={imgSrc.includes('googleusercontent.com') || imgSrc === '/default-avatar.jpg'}
        className={`rounded-full border-pink-500 dark:border-pink-500 ${className}`}
        onError={() => setImgSrc('/default-avatar.jpg')}
      />
    </>
  );
};

export default Avatar;
