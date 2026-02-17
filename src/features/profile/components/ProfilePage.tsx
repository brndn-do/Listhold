'use client';

import Loading from '@/app/loading';
import { useAuth } from '@/features/_shared/context/AuthProvider';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import Button from '@/features/_shared/components/ui/Button';
import Avatar from '@/features/_shared/components/ui/Avatar';
import InlineError from '@/features/_shared/components/ui/InlineError';
import { saveProfile } from '@/features/_shared/api/save-profile';
import Spinner from '@/features/_shared/components/ui/Spinner';
import { UserProfile } from '@/features/_shared/api/fetch-profile';

// Schema for profile validation
const profileSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters')
    .transform((s) => s.trim()),
});

type ProfileSchemaType = z.infer<typeof profileSchema>;

const SUCCESS_TIME = 3000;
const ERROR_TIME = 5000;

const ProfilePage = () => {
  const { user, loading, updateUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileSchemaType>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: '',
    },
  });

  // Update form values when user data loads
  useEffect(() => {
    if (user?.displayName) {
      // reset() sets the new "default" values, so isDirty becomes false
      // until the user types something new.
      reset({ displayName: user.displayName });
    }
  }, [user, reset]);

  // Handle form submission
  const onSubmit = async (data: ProfileSchemaType) => {
    if (!user) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const updatedUser: UserProfile = {
        ...user,
        displayName: data.displayName,
        profileCompletedAt: new Date(),
      };

      await saveProfile(updatedUser);
      updateUser(updatedUser);
      setSaveSuccess(true);

      reset({ displayName: data.displayName });

      // Clear success message after delay
      setTimeout(() => {
        setSaveSuccess(false);
      }, SUCCESS_TIME);
    } catch (err) {
      setSaveError('Failed to save profile. Please try again.');

      setTimeout(() => {
        setSaveError(null);
      }, ERROR_TIME);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return (
      <div className='flex flex-col items-center gap-4 pt-20'>
        <h1 className='text-xl font-bold'>Sign in to view your profile.</h1>
        <Link href='/' className='text-purple-600 underline dark:text-purple-400'>
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className='flex w-full max-w-md flex-col items-center'>
      <h1 className='mb-6 text-2xl font-bold'>Edit Profile</h1>

      <div className='w-full rounded-2xl border-2 border-purple-700 p-6 dark:border-purple-600'>
        <div className='mb-8 flex flex-col items-center'>
          <div className='relative mb-4'>
            <Avatar
              src={user.avatarURL}
              alt={user.displayName || 'User'}
              size={96}
              className='border-4'
              priority
            />
          </div>
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            Profile photo linked to your account
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
          <div className='mb-4 flex flex-col gap-2'>
            <label
              htmlFor='displayName'
              className='text-sm font-medium text-gray-700 dark:text-gray-300'
            >
              Display Name
            </label>
            <input
              id='displayName'
              {...register('displayName')}
              className='w-full rounded-xl border border-gray-300 bg-transparent px-4 py-2.5 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-purple-600 dark:border-gray-700'
              placeholder='Your Name'
              autoComplete='name'
            />
            {errors.displayName && <InlineError size='sm' content={errors.displayName.message} />}
          </div>

          <div className='mb-4 flex h-4 items-center justify-end gap-4 px-4'>
            {!saveSuccess && !saveError && (
              <Button
                type='submit'
                disabled={isSaving || !isDirty}
                content={
                  isSaving ? (
                    <div className='flex items-center gap-2'>
                      <Spinner />
                      <span>Saving...</span>
                    </div>
                  ) : (
                    'Save Changes'
                  )
                }
              />
            )}

            {saveSuccess && (
              <span className='text-sm text-green-600 dark:text-green-400'>
                Saved successfully!
              </span>
            )}
            {saveError && <InlineError size='sm' justify='start' content={saveError} />}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
