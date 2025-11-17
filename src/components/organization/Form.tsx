'use client';

import { getFunctions, httpsCallable } from 'firebase/functions';
import Button from '../ui/Button';
import FormInput from '../ui/FormInput';
import { app } from '@/lib/firebase';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';

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

const Form = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [valid, setValid] = useState(true); // are the inputs valid?
  const [formData, setFormData] = useState<FormData>({
    id: '',
    name: '',
    description: '',
  });

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

  const submitForm = async () => {
    try {
      const functions = getFunctions(app);
      const createOrganization = httpsCallable<CreateOrganizationRequest, CreateOrganizationResult>(
        functions,
        'createOrganization',
      );
      // TODO make sure empty strings become omitted
      const result = await createOrganization(formData);
      router.push(`/organizations/${result.data.organizationId}`);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <form className='w-full'>
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
      <div>
        <Button
          onClick={submitForm}
          disabled={!user || !valid}
          content={
            !user ? 'Sign In to Create Organization' : !valid ? 'Please enter a name' : 'Submit'
          }
        />
      </div>
    </form>
  );
};

export default Form;
