'use client';

import Button from '../ui/Button';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import Spinner from '../ui/Spinner';

import { z } from 'zod';
import { createEvent } from '@/services/createEvent';
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import ErrorMessage from '@/components/ui/ErrorMessage';

const promptSchema = z.object({
  displayOrder: z.number().min(1),
  promptType: z.enum(['yes/no', 'notice']),
  promptText: z
    .string()
    .min(1, {
      message: 'Text cannot be empty.',
    })
    .max(100, {
      message: 'Text cannot exceed 100 characters.',
    }),
  isRequired: z.boolean(),
  isPrivate: z.boolean(),
});

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
  const { user } = useAuth();
  const {
    handleSubmit,
    register,
    formState: { errors, isValid, isDirty },
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

  const [functionError, setFunctionError] = useState<string | null>(null);
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
    if (!user) return;

    setFunctionError(null);
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
        setFunctionError('You do not have permission to create events for this organization.');
      } else if (error.message === 'already-exists') {
        setFunctionError('An event with that slug already exists. Try again in a bit.');
      } else {
        setFunctionError('An unexpected error occurred. Please try again.');
      }
      setTimeout(() => {
        setFunctionError(null);
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
        <div className='relative z-0 w-full mb-3 group'>
          <label htmlFor='name' className='block mb-2.5'>
            Event Name
          </label>
          <input
            {...register('name', { required: true })}
            placeholder='My Event'
            className='w-full border dark:border-gray-500 rounded-lg px-3 py-2'
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
          <label htmlFor='slug' className='block mb-2.5'>
            A unique slug (optional)
          </label>
          <input
            {...register('slug', { required: false })}
            placeholder='my-event-123'
            className='w-full border dark:border-gray-500 rounded-lg px-3 py-2'
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
          <label htmlFor='location' className='block mb-2.5'>
            Location
          </label>
          <input
            {...register('location', { required: true })}
            placeholder='123 Example St'
            className='w-full border dark:border-gray-500 rounded-lg px-3 py-2'
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
          <label className='block mb-2.5'>Start Date & Time</label>
          <div className='flex gap-2'>
            <div className='flex-1 min-w-0'>
              <input
                type='date'
                {...register('startDate', { required: true })}
                className=' min-w-0 w-full border dark:border-gray-500 rounded-lg px-3 py-2'
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
                className='w-full min-w-0 border dark:border-gray-500 rounded-lg px-3 py-2'
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
          <label className='block mb-2.5'>End Date & Time</label>
          <div className='flex gap-2'>
            <div className='flex-1 min-w-0'>
              <input
                type='date'
                {...register('endDate', { required: true })}
                className='w-full min-w-0 border dark:border-gray-500 rounded-lg px-3 py-2'
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
                className='w-full min-w-0 border dark:border-gray-500 rounded-lg px-3 py-2'
                style={{ WebkitAppearance: 'none' }}
              />
              {errors.endTime && (
                <div className='w-full pl-2 mt-1'>
                  <ErrorMessage size='xs' justify='start' content={errors.endTime.message} />
                </div>
              )}
            </div>
          </div>
          {customError && (
            <div className='w-full pl-2 mt-1'>
              <ErrorMessage size='xs' justify='start' content={customError} />
            </div>
          )}
        </div>

        {/* Capacity */}
        <div className='relative z-0 w-full mb-3 group'>
          <label htmlFor='capacity' className='block mb-2.5'>
            Capacity
          </label>
          <input
            type='number'
            {...register('capacity', { required: true })}
            placeholder='20'
            className='w-full border dark:border-gray-500 rounded-lg px-3 py-2'
            spellCheck={false}
            autoComplete='off'
          />
          {errors.capacity && (
            <div className='w-full pl-2 mt-1'>
              <ErrorMessage size='xs' justify='start' content={errors.capacity.message} />
            </div>
          )}
        </div>

        {/* Description */}
        <div className='relative z-0 w-full mb-3 group'>
          <label htmlFor='description' className='block mb-2.5'>
            Description (optional)
          </label>
          <textarea
            {...register('description', { required: false })}
            placeholder='Event description...'
            className='w-full border dark:border-gray-500 rounded-lg px-3 py-2'
            rows={4}
            spellCheck={false}
            autoComplete='off'
          />
          {errors.description && (
            <div className='w-full pl-2 mt-1'>
              <ErrorMessage size='xs' justify='start' content={errors.description.message} />
            </div>
          )}
        </div>

        {/* Prompts Section */}
        <div className='mt-3 pt-3 border-t border-gray-300'>
          <h3 className='mb-2'>Signup Prompts (Optional)</h3>
          <p className='text-xs text-gray-500 mb-4'>
            Add custom questions or notices for attendees when they sign up.
          </p>

          {fields.length > 0 && (
            <div className='space-y-4 mb-2'>
              {fields.map((field, index) => (
                <div key={field.id} className='p-4 border dark:border-gray-500 rounded-lg'>
                  <div className='flex justify-between items-center mb-3'>
                    <h4 className='font-medium'>Prompt {index + 1}</h4>
                    <button
                      type='button'
                      onClick={() => remove(index)}
                      className='text-red-600 dark:text-red-500 hover:cursor-pointer'
                    >
                      Remove
                    </button>
                  </div>

                  {/* Prompt Type */}
                  <div className='mb-2'>
                    <label className='block mb-2'>Type</label>
                    <select
                      {...register(`prompts.${index}.promptType`)}
                      className='w-full border dark:border-gray-500 rounded-lg px-3 py-2 bg-background text-foreground'
                    >
                      <option value='yes/no'>Yes/No Question</option>
                      <option value='notice'>Notice (users click &quot;I understand&quot;)</option>
                    </select>
                    {errors.prompts?.[index]?.promptType && (
                      <div className='w-full pl-2 mt-1'>
                        <ErrorMessage
                          size='xs'
                          justify='start'
                          content={errors.prompts[index]?.promptType?.message}
                        />
                      </div>
                    )}
                  </div>

                  {/* Prompt Text */}
                  <div className='mb-4'>
                    <label className='block mb-2'>Text</label>
                    <input
                      {...register(`prompts.${index}.promptText`)}
                      placeholder='e.g., Will you need parking?'
                      className='w-full border dark:border-gray-500 rounded-lg px-3 py-2'
                      spellCheck={false}
                      autoComplete='off'
                    />
                    {errors.prompts?.[index]?.promptText && (
                      <div className='w-full pl-2 mt-1'>
                        <ErrorMessage
                          size='xs'
                          justify='start'
                          content={errors.prompts[index]?.promptText?.message}
                        />
                      </div>
                    )}
                  </div>

                  {/* Checkboxes */}
                  <div className='flex gap-4'>
                    <label className='flex items-center gap-2 cursor-pointer'>
                      <input
                        type='checkbox'
                        {...register(`prompts.${index}.isRequired`)}
                        className='w-4 h-4 cursor-pointer'
                      />
                      <span className='text-sm'>Required</span>
                    </label>
                    {watch(`prompts.${index}.promptType`) !== 'notice' && (
                      <label className='flex items-center gap-2 cursor-pointer'>
                        <input
                          type='checkbox'
                          {...register(`prompts.${index}.isPrivate`)}
                          className='w-4 h-4 cursor-pointer'
                        />
                        <span className='text-sm'>
                          Private (only you and admins can see responses)
                        </span>
                      </label>
                    )}
                  </div>

                  {/* Hidden displayOrder field */}
                  <input
                    type='hidden'
                    {...register(`prompts.${index}.displayOrder`, { valueAsNumber: true })}
                  />
                </div>
              ))}
            </div>
          )}

          <button
            type='button'
            onClick={addPrompt}
            className='text-purple-700 dark:text-purple-500 hover:cursor-pointer'
          >
            + Add Prompt
          </button>
        </div>
      </div>
      <div className='max-w-full flex flex-col gap-4 mt-4'>
        {functionError && <p className='max-w-full text-red-600'>{functionError}</p>}
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
