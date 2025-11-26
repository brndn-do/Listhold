'use client';

import { FunctionsError, httpsCallable } from 'firebase/functions';
import Button from './ui/Button';
import FormInput from './ui/FormInput';
import { functions } from '@/lib/firebase';
import { FormEventHandler, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import Spinner from './ui/Spinner';

import { z, ZodError } from 'zod';

// Zod Schema for Event Creation
const eventSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: 'Event name must be at least 2 characters' })
      .max(100, { message: 'Event name cannot exceed 100 characters' })
      .transform((s) => s.trim()),
    location: z
      .string()
      .min(2, { message: 'Location must be at least 2 characters' })
      .max(100, { message: 'Location cannot exceed 100 characters' })
      .transform((s) => s.trim()),
    start: z.iso.datetime({
      message: 'Invalid start date and time format (YYYY-MM-DDTHH:mm)',
    }),
    end: z.iso.datetime({
      message: 'Invalid end date and time format (YYYY-MM-DDTHH:mm)',
    }),
    capacity: z
      .string()
      .min(1, { message: 'Capacity is required' })
      .regex(/^\d+$/, { message: 'Capacity must be a positive number' })
      .transform((val) => parseInt(val, 10))
      .pipe(
        z
          .number()
          .int()
          .min(1, { message: 'Capacity must be at least 1' })
          .max(300, { message: 'Capacity cannot exceed 300' }),
      ),
    eventId: z.preprocess(
      (val) => (val === '' ? undefined : val),
      z
        .string()
        .trim()
        .min(4, { message: 'Custom ID must be at least 4 characters' })
        .max(50, { message: 'Custom ID cannot exceed 50 characters' })
        .regex(/^[a-zA-Z0-9_-]+$/, {
          message: 'Custom ID can only contain letters, numbers, hyphens (-), and underscores (_).',
        })
        .refine((val) => val.toLowerCase() !== 'new', {
          message: "The ID 'new' is a reserved word and cannot be used.",
        })
        .optional(),
    ),
  })
  .superRefine((data, ctx) => {
    if (new Date(data.start) >= new Date(data.end)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date and time must be after start date and time',
        path: ['end'],
      });
    }
  });

// Type for the data sent to the cloud function
type CreateEventRequest = z.infer<typeof eventSchema> & { organizationId: string };

// Type for the internal form state (all inputs are strings)
interface FormData {
  name: string;
  location: string;
  start: string;
  end: string;
  capacity: string; // Stored as string in form state
  eventId: string;
}

interface CreateEventResult {
  eventId: string;
  message: string;
}

interface EventFormProps {
  organizationId: string;
  ownerId: string;
}

const ERROR_TIME = 5000; // how long to display error before allowing retries

const EventForm = ({ organizationId, ownerId }: EventFormProps) => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    location: '',
    start: '',
    end: '',
    capacity: '',
    eventId: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string | undefined>>({});
  const [functionError, setFunctionError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // handles any changes in form inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (formErrors[id]) {
      setFormErrors((prev) => ({ ...prev, [id]: undefined }));
    }
  };

  const submitForm: FormEventHandler = async (e) => {
    e.preventDefault();
    if (!user) return;

    setFunctionError(null);
    setFormErrors({}); // clear previous errors

    // Check if date stings are empty before trying to convert them to ISO 8601 standard
    if (!formData.start || !formData.end) {
      const errors: Record<string, string | undefined> = {};
      if (!formData.start) errors.start = 'Start date and time is required.';
      if (!formData.end) errors.end = 'End date and time is required.';
      setFormErrors(errors);
      return;
    }
    // Convert datetimes to ISO 8601
    const toValidate = {
      ...formData,
      start: new Date(formData.start).toISOString(),
      end: new Date(formData.end).toISOString(),
    };

    let validatedData: CreateEventRequest;
    try {
      // Validate form data using Zod schema
      const parsedData = eventSchema.parse(toValidate);
      validatedData = { ...parsedData, organizationId }; // Add organizationId from props
    } catch (err) {
      if (err instanceof ZodError) {
        const flat = z.flattenError(err);
        const fieldErrors = flat.fieldErrors as Record<string, string[] | undefined> | undefined;
        const errors: Record<string, string | undefined> = {};

        if (fieldErrors) {
          for (const [field, messages] of Object.entries(fieldErrors)) {
            if (Array.isArray(messages) && messages.length > 0) {
              errors[field] = messages[0];
            } else {
              errors[field] = undefined;
            }
          }
        }
        setFormErrors(errors);
      }
      console.log('Validation failed, preventing submission...');
      return; // stop submission if validation fails
    }

    // validated, continue
    setIsLoading(true);
    try {
      const createEvent = httpsCallable<CreateEventRequest, CreateEventResult>(
        functions,
        'createEvent', // This cloud function needs to be implemented
      );
      const result = await createEvent(validatedData);
      router.push(`/events/${encodeURIComponent(result.data.eventId)}`);
    } catch (err) {
      setIsLoading(false);
      const firebaseError = err as FunctionsError;
      console.error('Firebase functions Error:', firebaseError.message);
      console.log(firebaseError.code);
      if (firebaseError.code.includes('permission-denied')) {
        setFunctionError('You do not have permission to create events for this organization.');
      } else if (firebaseError.code.includes('already-exists')) {
        setFunctionError('An event with that ID already exists. Try again in a bit.');
      } else {
        setFunctionError('An unexpected error occurred. Please try again.');
      }
      setTimeout(() => {
        setFunctionError(null);
      }, ERROR_TIME);
    }
  };

  // Determine if the form is generally valid for button state
  const isFormValid =
    formData.name.length > 0 &&
    formData.location.length > 0 &&
    formData.start.length > 0 &&
    formData.end.length > 0 &&
    formData.capacity.length > 0;

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
    <form onSubmit={submitForm} className='w-[80%] md:w-[40%] lg:w-[30%] xl:w-[25%] 2xl:w-[20%]'>
      <div>
        <FormInput
          id='name'
          required={true}
          label='Event Name'
          value={formData.name}
          onChange={handleChange}
        />
        <FormInput
          id='location'
          required={true}
          label='Location'
          value={formData.location}
          onChange={handleChange}
        />
        <FormInput
          id='eventId'
          required={false}
          label='Custom Event ID (optional)'
          value={formData.eventId}
          onChange={handleChange}
        />
        <FormInput
          id='start'
          required={true}
          label='Start Date & Time'
          type='datetime-local'
          value={formData.start}
          onChange={handleChange}
        />
        <FormInput
          id='end'
          required={true}
          label='End Date & Time'
          type='datetime-local'
          value={formData.end}
          onChange={handleChange}
        />
        <FormInput
          id='capacity'
          required={true}
          label='Capacity'
          type='number'
          value={formData.capacity}
          onChange={handleChange}
        />
      </div>
      <div className='max-w-full flex flex-col gap-4 mt-4'>
        {functionError && <p className='max-w-full text-sm text-red-600'>{functionError}</p>}
        {Object.keys(formErrors).length > 0 && (
          <div className='space-y-1'>
            {Object.values(formErrors)
              .filter((err) => err) // only truthy errors
              .map((err, i) => (
                <p key={i} className='max-w-full text-sm text-red-600'>
                  {`- ${err}`}
                </p>
              ))}
          </div>
        )}

        {!functionError && (
          <div>
            <Button
              type='submit'
              disabled={!isFormValid || isLoading}
              content={
                !isFormValid ? (
                  'Please fill out all required fields'
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
