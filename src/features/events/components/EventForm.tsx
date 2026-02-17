'use client';

import Button from '@/features/_shared/components/ui/Button';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { z } from 'zod';
import { createEvent } from '@/features/events/api/create-event';
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import InlineError from '@/features/_shared/components/ui/InlineError';
import Spinner from '@/features/_shared/components/ui/Spinner';

const promptSchema = z
  .object({
    displayOrder: z.number().min(1),
    promptType: z.enum(['yes/no', 'notice']),
    promptText: z
      .string()
      .min(1, {
        message: 'Text cannot be empty.',
      })
      .max(300, {
        message: 'Text cannot exceed 300 characters.',
      }),
    isRequired: z.boolean(),
    isPrivate: z.boolean(),
  })
  .transform((val) =>
    // if promptType is `notice` set isRequired and isPrivate to true no matter what
    val.promptType === 'notice' ? { ...val, isRequired: true, isPrivate: true } : val,
  );

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
    prompts: z.array(promptSchema).optional(),
  })
  .superRefine((data, ctx) => {
    const start = new Date(`${data.startDate}T${data.startTime}`);
    const end = new Date(`${data.endDate}T${data.endTime}`);
    if (start >= end) {
      ctx.addIssue({
        code: 'custom',
        message: 'End date and time must be after start date and time',
        path: [],
      });
    }
  });
type eventSchemaType = z.infer<typeof eventSchema>;

const ERROR_TIME = 5000; // how long to display error before allowing retries

const EventForm = () => {
  const router = useRouter();
  const {
    handleSubmit,
    register,
    formState: { errors },
    watch,
    control,
  } = useForm<eventSchemaType>({
    resolver: zodResolver(eventSchema),
    mode: 'onChange',
    defaultValues: {
      prompts: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'prompts',
  });

  const [createError, setCreateError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const addPrompt = () => {
    append({
      displayOrder: fields.length + 1,
      promptType: 'yes/no',
      promptText: '',
      isRequired: true,
      isPrivate: true,
    });
  };

  /**
   * react-hook-form does not work well with the superRefine check for start < end
   * that we defined in our zod schema, so we will just do this part manually
   * with watch() and useEffect()
   */
  const [customError, setCustomError] = useState<string | null>(null);
  // watch the date/time fields
  const startDate = watch('startDate');
  const startTime = watch('startTime');
  const endDate = watch('endDate');
  const endTime = watch('endTime');

  useEffect(() => {
    if (startDate && startTime && endDate && endTime) {
      const start = new Date(`${startDate}T${startTime}`);
      const end = new Date(`${endDate}T${endTime}`);

      if (start >= end) {
        setCustomError('End date and time must be after start date and time');
      } else {
        setCustomError(null);
      }
    } else {
      setCustomError(null);
    }
  }, [startDate, startTime, endDate, endTime]);

  const submitForm: SubmitHandler<eventSchemaType> = async (validatedData) => {
    setCreateError(null);
    setIsLoading(true);
    try {
      const { capacity, startDate, startTime, endDate, endTime, ...rest } = validatedData;
      const start = new Date(`${startDate}T${startTime}`).toISOString();
      const end = new Date(`${endDate}T${endTime}`).toISOString();
      const newValidatedData = { capacity: parseInt(capacity), start, end, ...rest };
      const toSend = { ...newValidatedData };
      const slug = await createEvent(toSend);
      router.push(`/events/${encodeURIComponent(slug)}`);
    } catch (err: unknown) {
      const error = err as Error;
      setIsLoading(false);
      if (error.message === 'permission-denied') {
        setCreateError('You do not have permission to create events for this organization.');
      } else if (error.message === 'already-exists') {
        setCreateError('An event with that slug already exists. Try again in a bit.');
      } else if (error.message === 'reserved') {
        setCreateError('Sorry, that slug is reserved. Try again in a bit.');
      } else {
        setCreateError('An unexpected error occurred. Please try again.');
      }
      setTimeout(() => {
        setCreateError(null);
      }, ERROR_TIME);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(submitForm)}
      className='w-full md:w-[70%] lg:w-[45%] xl:w-[40%] 2xl:w-[30%]'
    >
      <div>
        {/* Name */}
        <div className='group relative z-0 mb-3 w-full'>
          <label htmlFor='name' className='mb-2.5 flex gap-1'>
            Event Name
            <div className='text-red-600 dark:text-red-400'>{'*'}</div>
          </label>
          <input
            {...register('name', { required: true })}
            placeholder='My Event'
            className='w-full rounded-lg border px-3 py-2 dark:border-gray-500'
            spellCheck={false}
            autoComplete='off'
          />
          {errors.name && (
            <div className='mt-1 w-full px-2'>
              <InlineError size='sm' justify='start' content={errors.name.message} />
            </div>
          )}
        </div>

        {/* Slug */}
        <div className='group relative z-0 mb-3 w-full'>
          <label htmlFor='slug' className='mb-2.5 block'>
            A unique slug (optional, random if blank)
          </label>
          <input
            {...register('slug', { required: false })}
            placeholder='my-event-123'
            className='w-full rounded-lg border px-3 py-2 dark:border-gray-500'
            spellCheck={false}
            autoComplete='off'
          />
          <p className='mt-1 px-2 text-purple-600 dark:text-purple-400'>{`listhold.com/events/${watch('slug') ? watch('slug') : '...'}`}</p>
          {errors.slug && (
            <div className='mt-1 w-full px-2'>
              <InlineError size='sm' justify='start' content={errors.slug.message} />
            </div>
          )}
        </div>

        {/* Location */}
        <div className='group relative z-0 mb-3 w-full'>
          <label htmlFor='location' className='mb-2.5 flex gap-1'>
            Location
            <div className='text-red-600 dark:text-red-400'>{'*'}</div>
          </label>
          <input
            {...register('location', { required: true })}
            placeholder='123 Example St'
            className='w-full rounded-lg border px-3 py-2 dark:border-gray-500'
            spellCheck={false}
            autoComplete='off'
          />
          {errors.location && (
            <div className='mt-1 w-full px-2'>
              <InlineError size='sm' justify='start' content={errors.location.message} />
            </div>
          )}
        </div>

        {/* Start Date & Time */}
        <div className='group relative z-0 mb-3 w-full'>
          <label className='mb-2.5 flex gap-1'>
            Start Date & Time <div className='text-red-600 dark:text-red-400'>{'*'}</div>
          </label>
          <div className='flex gap-2'>
            <div className='min-w-0 flex-1'>
              <input
                type='date'
                {...register('startDate', { required: true })}
                className='w-full min-w-0 rounded-lg border px-3 py-2 dark:border-gray-500'
                style={{ WebkitAppearance: 'none' }}
              />
              {errors.startDate && (
                <div className='mt-1 w-full px-2'>
                  <InlineError size='sm' justify='start' content={errors.startDate.message} />
                </div>
              )}
            </div>
            <div className='min-w-0 flex-1'>
              <input
                type='time'
                {...register('startTime', { required: true })}
                className='w-full min-w-0 rounded-lg border px-3 py-2 dark:border-gray-500'
                style={{ WebkitAppearance: 'none' }}
              />
              {errors.startTime && (
                <div className='mt-1 w-full px-2'>
                  <InlineError size='sm' justify='start' content={errors.startTime.message} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* End Date & Time */}
        <div className='group relative z-0 mb-3 w-full'>
          <label className='mb-2.5 flex gap-1'>
            End Date & Time <div className='text-red-600 dark:text-red-400'>{'*'}</div>
          </label>
          <div className='flex gap-2'>
            <div className='min-w-0 flex-1'>
              <input
                type='date'
                {...register('endDate', { required: true })}
                className='w-full min-w-0 rounded-lg border px-3 py-2 dark:border-gray-500'
                style={{ WebkitAppearance: 'none' }}
              />
              {errors.endDate && (
                <div className='mt-1 w-full px-2'>
                  <InlineError size='sm' justify='start' content={errors.endDate.message} />
                </div>
              )}
            </div>
            <div className='min-w-0 flex-1'>
              <input
                type='time'
                {...register('endTime', { required: true })}
                className='w-full min-w-0 rounded-lg border px-3 py-2 dark:border-gray-500'
                style={{ WebkitAppearance: 'none' }}
              />
              {errors.endTime && (
                <div className='mt-1 w-full px-2'>
                  <InlineError size='sm' justify='start' content={errors.endTime.message} />
                </div>
              )}
            </div>
          </div>
          {customError && (
            <div className='mt-1 w-full px-2'>
              <InlineError size='sm' justify='start' content={customError} />
            </div>
          )}
        </div>

        {/* Capacity */}
        <div className='group relative z-0 mb-3 w-full'>
          <label htmlFor='capacity' className='mb-2.5 flex gap-1'>
            Capacity <div className='text-red-600 dark:text-red-400'>{'*'}</div>
          </label>
          <input
            type='number'
            {...register('capacity', { required: true })}
            placeholder='20'
            className='w-full rounded-lg border px-3 py-2 dark:border-gray-500'
            spellCheck={false}
            autoComplete='off'
          />
          <p className='mt-2 px-2 text-sm text-gray-600 dark:text-gray-400'>
            The maximum number of confirmed attendees. Once full, users will be able to join a
            waitlist. If a confirmed attendee leaves the event while there is a waitlist, the next
            person on the waitlist is automatically confirmed, and an email will be sent to them.
          </p>
          {errors.capacity && (
            <div className='mt-1 w-full px-2'>
              <InlineError size='sm' justify='start' content={errors.capacity.message} />
            </div>
          )}
        </div>

        {/* Description */}
        <div className='group relative z-0 mb-3 w-full'>
          <label htmlFor='description' className='mb-2.5 block'>
            Description (optional)
          </label>
          <textarea
            {...register('description', { required: false })}
            placeholder='Event description...'
            className='w-full rounded-lg border px-3 py-2 dark:border-gray-500'
            rows={4}
            spellCheck={false}
            autoComplete='off'
          />
          {errors.description && (
            <div className='mt-1 w-full px-2'>
              <InlineError size='sm' justify='start' content={errors.description.message} />
            </div>
          )}
        </div>

        {/* Prompts Section */}
        <div className='mt-3 border-t border-gray-300 pt-3'>
          <h3 className='mb-2'>Signup Prompts (Optional)</h3>
          <p className='mb-4 text-sm text-gray-600 dark:text-gray-400'>
            Add custom questions or notices for attendees when they sign up.
          </p>

          {fields.length > 0 && (
            <div className='mb-2 space-y-4'>
              {fields.map((field, index) => (
                <div key={field.id} className='rounded-lg border p-4 dark:border-gray-500'>
                  <div className='mb-3 flex items-center justify-between'>
                    <h4 className='font-medium'>Prompt {index + 1}</h4>
                    <button
                      type='button'
                      onClick={() => remove(index)}
                      className='text-red-600 hover:cursor-pointer dark:text-red-400'
                    >
                      Remove
                    </button>
                  </div>

                  {/* Prompt Type */}
                  <div className='mb-2'>
                    <label className='mb-2 block'>Type</label>
                    <select
                      {...register(`prompts.${index}.promptType`)}
                      className='bg-background text-foreground w-full rounded-lg border px-3 py-2 dark:border-gray-500'
                    >
                      <option value='yes/no'>Yes/No Question</option>
                      <option value='notice'>Notice (users must acknowledge)</option>
                    </select>
                    {errors.prompts?.[index]?.promptType && (
                      <div className='mt-1 w-full px-2'>
                        <InlineError
                          size='xs'
                          justify='start'
                          content={errors.prompts[index]?.promptType?.message}
                        />
                      </div>
                    )}
                  </div>

                  {/* Prompt Text */}
                  <div className='mb-4'>
                    <label className='mb-2 block'>Text</label>
                    <textarea
                      {...register(`prompts.${index}.promptText`)}
                      placeholder={
                        watch(`prompts.${index}.promptType`) === 'notice'
                          ? 'e.g., By continuing, you agree to the community guidelines.'
                          : 'e.g., Will you need parking?'
                      }
                      className='w-full rounded-lg border px-3 py-2 dark:border-gray-500'
                      rows={4}
                      spellCheck={false}
                      autoComplete='off'
                    />
                    {errors.prompts?.[index]?.promptText && (
                      <div className='mt-1 w-full px-2'>
                        <InlineError
                          size='xs'
                          justify='start'
                          content={errors.prompts[index]?.promptText?.message}
                        />
                      </div>
                    )}
                  </div>

                  {/* Checkboxes */}
                  {watch(`prompts.${index}.promptType`) !== 'notice' && (
                    <div className='flex gap-4'>
                      <label className='flex cursor-pointer items-center gap-2'>
                        <input
                          type='checkbox'
                          {...register(`prompts.${index}.isRequired`)}
                          className='h-4 w-4 cursor-pointer'
                        />
                        <span className='text-sm'>Required</span>
                      </label>
                      <label className='flex cursor-pointer items-center gap-2'>
                        <input
                          type='checkbox'
                          {...register(`prompts.${index}.isPrivate`)}
                          className='h-4 w-4 cursor-pointer'
                        />
                        <span className='text-sm'>
                          Private (only you and admins can see responses)
                        </span>
                      </label>
                    </div>
                  )}

                  {/* Hidden displayOrder field */}
                  <input
                    type='hidden'
                    {...register(`prompts.${index}.displayOrder`, { valueAsNumber: true })}
                  />
                </div>
              ))}
            </div>
          )}

          <div>
            <button
              type='button'
              onClick={addPrompt}
              className='text-purple-600 hover:cursor-pointer dark:text-purple-400'
            >
              + Add Prompt
            </button>
          </div>
        </div>
      </div>
      <div className='mt-4 flex max-w-full justify-end'>
        {createError && <p className='text-red-600'>{createError}</p>}
        {!createError && (
          <Button
            type='submit'
            disabled={isLoading}
            content={
              isLoading ? (
                <>
                  <Spinner />
                  Loading...
                </>
              ) : (
                'Create Event'
              )
            }
          />
        )}
      </div>
    </form>
  );
};

export default EventForm;
