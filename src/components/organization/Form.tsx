'use client';

import { getFunctions, httpsCallable } from 'firebase/functions';
import Button from '../ui/Button';
import FormInput from '../ui/FormInput';
import { app } from '@/lib/firebase';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';

interface CreateOrganizationRequest {
  id?: string;
  name: string;
  description?: string;
  contactEmail?: string;
}

interface CreateOrganizationResult {
  organizationId: string;
  message: string;
}

const Form = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [valid, setValid] = useState(true); // are the inputs valid?
  const [formData, setFormData] = useState<CreateOrganizationRequest>({
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
      const result = await createOrganization(formData);
      router.push(`/organizations/${result.data.organizationId}`);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <form className='max-w-md mx-auto'>
      <div className='grid md:grid-cols-2 md:gap-6'>
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
        <FormInput
          id='description'
          required={false}
          text='Description (optional)'
          value={formData.description}
          onChange={handleChange}
        ></FormInput>
      </div>
      <Button onClick={submitForm} disabled={!user || !valid} content={ !user ? 'Sign In to Create Organization' : !valid ? 'Please enter a name' : 'Submit'
      } />
    </form>
  );
};

export default Form;
