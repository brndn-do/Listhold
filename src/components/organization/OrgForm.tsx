'use client';

import Button from '../ui/Button';
import FormInput from '../ui/FormInput';
import { FormEventHandler, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import Spinner from '../ui/Spinner';

import { z, ZodError } from 'zod';
import { createOrg } from '@/services/createOrg';
import { ServiceError, ServiceErrorMessage } from '@/types/serviceError';

const organizationSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Organization name must be at least 2 characters' })
    .max(50, { message: 'Organization name cannot exceed 50 characters' })
    .transform((s) => s.trim()),
  slug: z
    .string()
    .min(3, { message: 'Slug must be at least 4 characters' })
    .max(36, { message: 'Slug cannot exceed 36 characters' })
    .regex(/^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9]))*[a-z0-9]$/, {
      message: 'Invalid Slug',
    })
    .optional(),
});

// schema defined by zod and expected by our cloud function
type CreateOrganizationRequest = z.infer<typeof organizationSchema>;

// inputs are all strings, including empty strings, but zod's preprocess takes care of it
interface FormData {
  slug: string;
  name: string;
}

const ERROR_TIME = 5000; // how long to display error before allowing retries

const OrgForm = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({ slug: '', name: '' });
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

    const toValidate: { slug: string | undefined; name: string } = {
      slug: formData.slug.trim() || undefined,
      name: formData.name.trim(),
    };

    let validatedData: CreateOrganizationRequest;
    try {
      validatedData = organizationSchema.parse(toValidate);
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
      return; // stop submission if validation fails
    }

    // validated, continue
    setIsLoading(true);
    try {
      const orgSlug = await createOrg(validatedData);
      router.push(`/organizations/${encodeURIComponent(orgSlug)}`);
    } catch (err: unknown) {
      const error = err as ServiceError;
      const msg = error.message as ServiceErrorMessage;
      if (msg === 'already-exists') {
        setFunctionError('An organization with that id already exists. Try again in a bit.');
      } else {
        setFunctionError('An unexpected error occured. Try again in a bit.');
      }
      setTimeout(() => {
        setFunctionError(null);
      }, ERROR_TIME);
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={submitForm} className='w-[80%] md:w-[60%] lg:w-[50%] xl:w-[30%] 2xl:w-[25%]'>
      <div>
        <FormInput
          id='name'
          required={true}
          label='Name'
          value={formData.name}
          onChange={handleChange}
        />
        <FormInput
          id='slug'
          required={false}
          label='A unique slug (optional)'
          value={formData.slug}
          onChange={handleChange}
        />
      </div>
      <div className='max-w-full flex flex-col gap-4'>
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
              disabled={!user || isLoading}
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
