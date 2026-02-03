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
        <div className='mb-3 flex flex-col items-center gap-4'>
          <Avatar
            src={user.avatarURL}
            alt={user.displayName || 'Profile'}
            size={96}
            className='border-4'
          />
          <p className='text-2xl font-semibold text-purple-600 dark:text-purple-400'>
            {user.displayName || 'Unknown'}
          </p>
        </div>

        <h3 className='mb-4 text-center text-lg font-semibold'>
          Does this profile information look okay?
        </h3>

        <div className='mx-auto w-[90%] flex gap-4 flex-col items-center'>
          <div className='w-full mb-2 flex flex-col gap-4'>
            <Button
              content={
                loading ? (
                  <div className='py-1 w-full justify-center'>
                    <Spinner />
                    Yes, continue
                  </div>
                ) : (
                  <div className='py-1 w-full justify-center'>Yes, continue</div>
                )
              }
              onClick={markProfileCompleted}
              disabled={loading}
              semibold={true}
            />
            <Button
              content={<div className='py-1 w-full justify-center'>No, edit my profile</div>}
              inverted={true}
              semibold={true}
              onClick={() => {
                onClose();
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
