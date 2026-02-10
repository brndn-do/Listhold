import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { ProfileData } from '@/services/fetchProfile';
import { saveProfile } from '@/services/saveProfile';
import { useState } from 'react';
import Avatar from '@/components/ui/Avatar';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';

interface CompleteProfilePopupProps {
  user: ProfileData | null;
  onClose: () => void;
}

const CompleteProfilePopup = ({ user, onClose }: CompleteProfilePopupProps) => {
  const router = useRouter();
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!user) {
    return null;
  }

  const markProfileCompleted = async () => {
    setLoading(true);
    try {
      const updatedUser = {
        ...user,
        profileCompletedAt: new Date(),
      };
      await saveProfile(updatedUser);
      updateUser(updatedUser);
      onClose();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className='fixed z-100 flex h-full w-full items-center justify-center rounded-xl bg-white/60 p-4 backdrop-blur dark:border-purple-600 dark:bg-black/60'>
      <div className='dark:bg-background/70 flex w-full max-w-md flex-col rounded-4xl bg-gray-200/50 p-8'>
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

        <div className='mx-auto flex w-[90%] flex-col items-center gap-4'>
          <div className='mb-2 flex w-full flex-col gap-4'>
            <Button
              content={
                loading ? (
                  <div className='inline-flex w-full justify-center py-1'>
                    <Spinner />
                  </div>
                ) : (
                  <div className='w-full justify-center py-1'>Yes, continue</div>
                )
              }
              onClick={markProfileCompleted}
              disabled={loading}
              semibold={true}
            />
            <Button
              content={<div className='w-full justify-center py-1'>No, edit my profile</div>}
              inverted={true}
              semibold={true}
              onClick={() => {
                onClose();
                router.push('/profile');
              }}
            />
          </div>
          <button
            className='text-sm text-gray-600 underline hover:cursor-pointer dark:text-gray-400'
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
