'use client';

import Button from '../ui/Button';
import { useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import Spinner from '../ui/Spinner';

import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { z } from 'zod';
import { createOrg } from '@/services/createOrg';
import { ServiceError, ServiceErrorMessage } from '@/types/serviceError';
import ErrorMessage from '@/components/ui/ErrorMessage';

const orgSchema = z.object({
  name: z
    .string()
    .transform((s) => s.trim())
    .refine((s) => s.length >= 2, { message: 'Organization name must be at least 2 characters' })
    .refine((s) => s.length <= 50, { message: 'Organization name cannot exceed 50 characters' }),
  slug: z
    .string()
    .transform((s) => s.trim())
    .transform((s) => s.toLowerCase())
    .transform((s) => (s === '' ? undefined : s))
    .refine((s) => !s || /^[a-z0-9-]+$/.test(s), {
      message: 'Slug must contain only letters, numbers, and hyphens (-).',
    })
    .refine((s) => !s || /^(?!-).*(?<!-)$/.test(s), {
      message: 'Slug cannot start or end with a hyphen.',
    })
    .refine((s) => !s || /^(?!.*--).*/.test(s), {
      message: 'Slug cannot have more than one hyphen in a row.',
    })
    .refine((s) => !s || s.length >= 4, {
      message: 'Slug must be at least 4 characters',
    })
    .refine((s) => !s || s.length <= 36, {
      message: 'Slug cannot exceed 36 characters',
    })
    .optional(),
  description: z
    .string()
    .transform((s) => s.trim())
    .transform((s) => (s === '' ? undefined : s))
    .refine((s) => !s || s.length <= 1000, {
      message: 'Description cannot exceed 1000 characters.',
    })
    .optional(),
});
type orgSchemaType = z.infer<typeof orgSchema>;
const ERROR_TIME = 5000; // how long to display error before allowing retries

const OrgForm = () => {
  const router = useRouter();
  const { user } = useAuth();
  const {
    handleSubmit,
    register,
    formState: { errors, isValid, isDirty },
  } = useForm<orgSchemaType>({
    resolver: zodResolver(orgSchema),
    mode: 'onChange',
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const submitForm: SubmitHandler<orgSchemaType> = async (validatedData: orgSchemaType) => {
    if (!user) return;

    setCreateError(null);
    setIsLoading(true);
    try {
      const orgSlug = await createOrg(validatedData);
      router.push(`/organizations/${encodeURIComponent(orgSlug)}`);
    } catch (err: unknown) {
      const error = err as ServiceError;
      const msg = error.message as ServiceErrorMessage;
      if (msg === 'already-exists') {
        setCreateError('An organization with that slug already exists. Try again in a bit.');
      } else if (msg === 'unauthorized') {
        setCreateError('Unauthorized. Are you signed in?');
      } else {
        setCreateError('An unexpected error occured. Try again in a bit.');
      }
      setTimeout(() => {
        setCreateError(null);
      }, ERROR_TIME);
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(submitForm)}
      className='w-full md:w-[70%] lg:w-[50%] xl:w-[30%] 2xl:w-[25%]'
    >
      <div>
        {/* Name */}
        <div className='relative z-0 w-full mb-3 group'>
          <label htmlFor='name' className='block mb-2.5 font-medium text-heading'>
            Organization Name
          </label>
          <input
            {...register('name', { required: true })}
            placeholder='My Organization'
            className='w-full border border-gray-500 rounded-lg px-3 py-2'
            spellCheck={false}
            autoComplete='off'
          />
          {errors.name && (
            <div className='w-full pl-2 mt-1'>
              <ErrorMessage size='xs' justify='start' content={errors.name.message} />
            </div>
          )}
        </div>

        {/* Slug */}
        <div className='relative z-0 w-full mb-3 group'>
          <label htmlFor='slug' className='block mb-2.5 font-medium text-heading'>
            A unique slug (optional)
          </label>
          <input
            {...register('slug', { required: false })}
            placeholder='my-org-123'
            className='w-full border border-gray-500 rounded-lg px-3 py-2'
            spellCheck={false}
            autoComplete='off'
          />
          {errors.slug && (
            <div className='w-full pl-2 mt-1'>
              <ErrorMessage size='xs' justify='start' content={errors.slug.message} />
            </div>
          )}
        </div>

        {/* Description */}
        <div className='relative z-0 w-full mb-3 group'>
          <label htmlFor='description' className='block mb-2.5 font-medium text-heading'>
            Description (optional)
          </label>
          <textarea
            {...register('description', { required: false })}
            className='h-48 w-full border border-gray-500 rounded-lg px-3 py-2 resize-none'
            spellCheck={false}
            autoComplete='off'
          />
          {errors.description && (
            <div className='w-full pl-2 mt-1'>
              <ErrorMessage size='xs' justify='start' content={errors.description.message} />
            </div>
          )}
        </div>
      </div>
      <div className='max-w-full flex flex-col gap-4'>
        {createError && <ErrorMessage justify={'start'} content={createError} />}
        {!createError && (
          <div>
            <Button
              type='submit'
              disabled={!user || isLoading || !isDirty || !isValid}
              content={
                !user ? (
                  'Sign In to Create Organization'
                ) : isLoading ? (
                  <>
                    <Spinner />
                    Loading...
                  </>
                ) : (
                  'Create Organization'
                )
              }
            />
          </div>
        )}
      </div>
    </form>
  );
};

export default OrgForm;
