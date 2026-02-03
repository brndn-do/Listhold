import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { ProfileData } from '@/services/fetchProfile';
import { saveProfile } from '@/services/saveProfile';
import { useState } from 'react';
import Avatar from '@/components/ui/Avatar';
import { useRouter } from 'next/navigation';

interface CompleteProfilePopupProps {
  user: ProfileData | null;
  onClose: () => void;
}

const CompleteProfilePopup = ({ user, onClose }: CompleteProfilePopupProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!user) {
    return null;
  }

  const markProfileCompleted = async () => {
    setLoading(true);
    try {
      await saveProfile({
        ...user,
        profileCompletedAt: new Date(),
      });
      onClose();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className='p-4 fixed z-50 w-full h-full flex items-center justify-center dark:border-purple-600 bg-white/60 dark:bg-black/60 backdrop-blur rounded-xl'>
      <div className='p-8 w-full max-w-md flex flex-col bg-gray-200/50 dark:bg-background/70 rounded-4xl'>
        <div className='mb-3 flex items-center gap-4'>
          <Avatar
            src={user.avatarURL}
            alt={user.displayName || 'Profile'}
            size={48}
            className='border-2'
          />
          <p className='text-2xl font-semibold text-purple-600 dark:text-purple-400 truncate'>
            {user.displayName || 'Unknown'}
          </p>
        </div>

        <h3 className='mb-4 text-lg font-semibold'>Does this profile information look okay?</h3>

        <div className='flex gap-4 flex-col items-center w-full'>
          <div className='mb-2 flex items-center gap-4 w-full'>
            <Button
              content={
                loading ? (
                  <>
                    <Spinner />
                    <p>Yes, continue</p>
                  </>
                ) : (
                  <p>Yes, continue</p>
                )
              }
              onClick={markProfileCompleted}
              disabled={loading}
            />
            <Button
              content='No, edit my profile'
              onClick={() => {
                router.push('/profile');
              }}
            />
          </div>
          <button
            className='text-sm underline text-gray-600 dark:text-gray-400 hover:cursor-pointer'
            onClick={onClose}
          >
            Remind me later
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfilePopup;
