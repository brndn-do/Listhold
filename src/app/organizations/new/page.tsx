import Form from '@/components/organization/Form';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Create Organization — Rosterize',
    description: 'Create a new organization to manage events',
  };
}

export default async function CreateOrganizationPage() {
  return (
    <div className='flex flex-col gap-8 px-2 py-8'>
      <h1 className='text-3xl text-center'>Create New Organization</h1>
      <Form />
    </div>
  );
}
