'use client';

import { FunctionsError, getFunctions, httpsCallable } from 'firebase/functions';
import Button from '../ui/Button';
import FormInput from '../ui/FormInput';
import { app } from '@/lib/firebase';
import React, { FormEventHandler, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import Spinner from '../ui/Spinner';

interface FormData {
  id: string;
  name: string;
  description: string;
}

interface CreateOrganizationRequest {
  id?: string;
  name: string;
}

interface CreateOrganizationResult {
  organizationId: string;
  message: string;
}

const ERROR_TIME = 5000; // how long to display error before allowing retries

const Form = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [valid, setValid] = useState(true); // are the inputs valid?
  const [formData, setFormData] = useState<FormData>({
    id: '',
    name: '',
    description: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [functionError, setFunctionError] = useState<string | null>(null);

  useEffect(() => {
    if (formData.name) setValid(true);
    else setValid(false);
  }, [user, formData.name]);

  // handles any changes in form inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value, // dynamically update correct field
    }));
  };

  const formatFormData = (): CreateOrganizationRequest => {
    const res: CreateOrganizationRequest = { name: formData.name };
    if (formData.id) {
      // if custom id provided, include it.
      res.id = formData.id;
    }
    return res;
  };

  const submitForm: FormEventHandler = async (e) => {
    e.preventDefault();
    const validatedData = formatFormData();
    setIsLoading(true);
    setFunctionError(null);
    try {
      const functions = getFunctions(app);
      const createOrganization = httpsCallable<CreateOrganizationRequest, CreateOrganizationResult>(
        functions,
        'createOrganization',
      );
      const result = await createOrganization(validatedData);
      router.push(`/organizations/${result.data.organizationId}`);
    } catch (err) {
      setIsLoading(false);
      const firebaseError = err as FunctionsError;
      console.error('Firebase functions Error:', firebaseError.message);
      console.log(firebaseError.code);
      if (firebaseError.code.includes('already-exists')) {
        setFunctionError('An organization with that id already exists. Try again in a bit.');
      } else {
        setFunctionError('An unexpected error occured. Try again in a bit.');
      }
      setTimeout(() => {
        setFunctionError(null);
      }, ERROR_TIME);
    }
  };

  return (
    <form onSubmit={submitForm} className='w-[80%] md:w-[40%] lg:w-[30%] xl:w-[25%] 2xl:w-[20%]'>
      <div>
        <FormInput
          id='id'
          required={false}
          text='A unique ID (optional)'
          value={formData.id}
          onChange={handleChange}
        />
        <FormInput
          id='name'
          required={true}
          text='Name'
          value={formData.name}
          onChange={handleChange}
        />
      </div>
      <div className='max-w-full'>
        {functionError && <p className='max-w-full text-sm text-red-600'>{functionError}</p>}
        {!functionError && (
          <Button
            type='submit'
            disabled={!user || !valid || isLoading}
            content={
              !user ? (
                'Sign In to Create Organization'
              ) : !valid ? (
                'Please enter a name'
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
        )}
      </div>
    </form>
  );
};

export default Form;
