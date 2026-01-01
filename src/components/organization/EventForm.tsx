'use client';

import Button from '../ui/Button';
import { useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import Spinner from '../ui/Spinner';

import { z } from 'zod';
import { createEvent } from '@/services/createEvent';
import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import ErrorMessage from '@/components/ui/ErrorMessage';

const eventSchema = z
  .object({
    name: z
      .string()
      .transform((s) => s.trim())
      .refine((s) => s.length >= 1, { message: 'Event name cannot be empty' })
      .refine((s) => s.length <= 50, { message: 'Event name cannot exceed 50 characters' }),
    location: z
      .string()
      .transform((s) => s.trim())
      .refine((s) => s.length >= 1, { message: 'Location cannot be empty' })
      .refine((s) => s.length <= 200, { message: 'Location cannot exceed 200 characters' }),
    startDate: z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
      message: 'Invalid start date',
    }),
    startTime: z.string().refine((val) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val), {
      message: 'Invalid start time',
    }),
    endDate: z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
      message: 'Invalid end date',
    }),
    endTime: z.string().refine((val) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val), {
      message: 'Invalid end time',
    }),
    capacity: z
      .string()
      .transform((s) => s.trim())
      .refine((s) => s.length >= 1, { message: 'Capacity cannot be empty' })
      .refine((s) => !isNaN(parseInt(s, 10)), { message: 'Capacity must be a number' })
      .refine(
        (s) => {
          const num = parseInt(s, 10);
          return num >= 1;
        },
        { message: 'Capacity must be at least 1' },
      )
      .refine(
        (s) => {
          const num = parseInt(s, 10);
          return num <= 300;
        },
        { message: 'Capacity cannot exceed 300' },
      ),
    slug: z
      .string()
      .transform((s) => s.trim())
      .transform((s) => s.toLowerCase())
      .transform((s) => (s === '' ? undefined : s))
      .refine((s) => !s || s.length >= 4, {
        message: 'Slug must be at least 4 characters',
      })
      .refine((s) => !s || s.length <= 36, {
        message: 'Slug cannot exceed 36 characters',
      })
      .refine((s) => !s || /^[a-z0-9-]+$/.test(s), {
        message: 'Slug must contain only letters, numbers, and hyphens (-).',
      })
      .refine((s) => !s || /^(?!-).*(?<!-)$/.test(s), {
        message: 'Slug cannot start or end with a hyphen.',
      })
      .refine((s) => !s || /^(?!.*--).*/.test(s), {
        message: 'Slug cannot have more than one hyphen in a row.',
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
    custom: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const start = new Date(`${data.startDate}T${data.startTime}`);
    const end = new Date(`${data.endDate}T${data.endTime}`);
    if (start >= end) {
      ctx.addIssue({
        code: 'custom',
        message: 'End date and time must be after start date and time',
        path: ['endTime'],
      });
    }
  });
type eventSchemaType = z.infer<typeof eventSchema>;

interface EventFormProps {
  orgSlug: string;
  ownerId: string;
}

const ERROR_TIME = 5000; // how long to display error before allowing retries

const EventForm = ({ orgSlug, ownerId }: EventFormProps) => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const {
    handleSubmit,
    register,
    formState: { errors, isValid, isDirty },
  } = useForm<eventSchemaType>({
    resolver: zodResolver(eventSchema),
    mode: 'onChange',
  });
  const [functionError, setFunctionError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const submitForm: SubmitHandler<eventSchemaType> = async (validatedData) => {
    if (!user) return;

    setFunctionError(null);
    setIsLoading(true);
    try {
      const { capacity, startDate, startTime, endDate, endTime, ...rest } = validatedData;
      const start = new Date(`${startDate}T${startTime}`).toISOString();
      const end = new Date(`${endDate}T${endTime}`).toISOString();
      const newValidatedData = { capacity: parseInt(capacity), start, end, ...rest };
      const toSend = { ...newValidatedData, orgSlug };
      const slug = await createEvent(toSend);
      router.push(`/events/${encodeURIComponent(slug)}`);
    } catch (err: unknown) {
      const error = err as Error;
      setIsLoading(false);
      if (error.message === 'permission-denied') {
        setFunctionError('You do not have permission to create events for this organization.');
      } else if (error.message === 'already-exists') {
        setFunctionError('An event with that ID already exists. Try again in a bit.');
      } else {
        setFunctionError('An unexpected error occurred. Please try again.');
      }
      setTimeout(() => {
        setFunctionError(null);
      }, ERROR_TIME);
    }
  };

  if (loading) {
    return <Spinner />;
  }

  if (user?.uid !== ownerId) {
    return (
      <p className='text-center'>
        You are not authorized to create an event on behalf of this organization.
        <br />
        If you are the owner, please sign in with the account you used to create this organization.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(submitForm)}
      className='w-full md:w-[70%] lg:w-[50%] xl:w-[30%] 2xl:w-[25%]'
    >
      <div>
        {/* Name */}
        <div className='relative z-0 w-full mb-3 group'>
          <label htmlFor='name' className='block mb-2.5 text-sm font-medium text-heading'>
            Event Name
          </label>
          <input
            {...register('name', { required: true })}
            placeholder='My Event'
            className='w-full border border-gray-500 text-sm rounded-lg px-3 py-2'
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
          <label htmlFor='slug' className='block mb-2.5 text-sm font-medium text-heading'>
            A unique slug (optional)
          </label>
          <input
            {...register('slug', { required: false })}
            placeholder='my-event-123'
            className='w-full border border-gray-500 text-sm rounded-lg px-3 py-2'
            spellCheck={false}
            autoComplete='off'
          />
          {errors.slug && (
            <div className='w-full pl-2 mt-1'>
              <ErrorMessage size='xs' justify='start' content={errors.slug.message} />
            </div>
          )}
        </div>

        {/* Location */}
        <div className='relative z-0 w-full mb-3 group'>
          <label htmlFor='location' className='block mb-2.5 text-sm font-medium text-heading'>
            Location
          </label>
          <input
            {...register('location', { required: true })}
            placeholder='123 Example St'
            className='w-full border border-gray-500 text-sm rounded-lg px-3 py-2'
            spellCheck={false}
            autoComplete='off'
          />
          {errors.location && (
            <div className='w-full pl-2 mt-1'>
              <ErrorMessage size='xs' justify='start' content={errors.location.message} />
            </div>
          )}
        </div>

        {/* Start Date & Time */}
        <div className='relative z-0 w-full mb-3 group'>
          <label className='block mb-2.5 text-sm font-medium text-heading'>Start Date & Time</label>
          <div className='flex gap-2'>
            <div className='flex-1 min-w-0'>
              <input
                type='date'
                {...register('startDate', { required: true })}
                className=' min-w-0 w-full border border-gray-500 text-sm rounded-lg px-3 py-2'
                style={{ WebkitAppearance: 'none' }}
              />
              {errors.startDate && (
                <div className='w-full pl-2 mt-1'>
                  <ErrorMessage size='xs' justify='start' content={errors.startDate.message} />
                </div>
              )}
            </div>
            <div className='flex-1 min-w-0'>
              <input
                type='time'
                {...register('startTime', { required: true })}
                className='w-full min-w-0 border border-gray-500 text-sm rounded-lg px-3 py-2'
                style={{ WebkitAppearance: 'none' }}
              />
              {errors.startTime && (
                <div className='w-full pl-2 mt-1'>
                  <ErrorMessage size='xs' justify='start' content={errors.startTime.message} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* End Date & Time */}
        <div className='relative z-0 w-full mb-3 group'>
          <label className='block mb-2.5 text-sm font-medium text-heading'>End Date & Time</label>
          <div className='flex gap-2'>
            <div className='flex-1 min-w-0'>
              <input
                type='date'
                {...register('endDate', { required: true })}
                className='w-full min-w-0 border border-gray-500 text-sm rounded-lg px-3 py-2'
                style={{ WebkitAppearance: 'none' }}
              />
              {errors.endDate && (
                <div className='w-full pl-2 mt-1'>
                  <ErrorMessage size='xs' justify='start' content={errors.endDate.message} />
                </div>
              )}
            </div>
            <div className='flex-1 min-w-0'>
              <input
                type='time'
                {...register('endTime', { required: true })}
                className='w-full min-w-0 border border-gray-500 text-sm rounded-lg px-3 py-2'
                style={{ WebkitAppearance: 'none' }}
              />
              {errors.endTime && (
                <div className='w-full pl-2 mt-1'>
                  <ErrorMessage size='xs' justify='start' content={errors.endTime.message} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Capacity */}
        <div className='relative z-0 w-full mb-3 group'>
          <label htmlFor='capacity' className='block mb-2.5 text-sm font-medium text-heading'>
            Capacity
          </label>
          <input
            type='number'
            {...register('capacity', { required: true })}
            placeholder='20'
            className='w-full border border-gray-500 text-sm rounded-lg px-3 py-2'
            spellCheck={false}
            autoComplete='off'
          />
          {errors.capacity && (
            <div className='w-full pl-2 mt-1'>
              <ErrorMessage size='xs' justify='start' content={errors.capacity.message} />
            </div>
          )}
        </div>
      </div>
      <div className='max-w-full flex flex-col gap-4 mt-4'>
        {functionError && <p className='max-w-full text-sm text-red-600'>{functionError}</p>}
        {!functionError && (
          <div>
            <Button
              type='submit'
              disabled={!user || isLoading || !isDirty || !isValid}
              content={
                !user ? (
                  'Sign In to Create Event'
                ) : isLoading ? (
                  <>
                    <Spinner />
                    Loading...
                  </>
                ) : (
                  'Create Event'
                )
              }
            />
          </div>
        )}
      </div>
    </form>
  );
};

export default EventForm;
