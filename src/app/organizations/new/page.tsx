import OrganizationForm from '@/components/organization/OrganizationForm';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Create Organization — Rosterize',
    description: 'Create a new organization to manage events',
  };
}

export default async function CreateOrganizationPage() {
  return (
    <div className='w-full flex flex-col justify-center items-center gap-8 px-2 py-8'>
      <h1 className='text-2xl font-bold text-center'>Create New Organization</h1>
      <OrganizationForm />
    </div>
  );
}
