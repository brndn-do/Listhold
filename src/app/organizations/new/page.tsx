import OrganizationForm from '@/components/organization/OrganizationForm';
import { Metadata } from 'next';

export const revalidate = false;

export const metadata: Metadata = {
  title: 'Create Organization—Rosterize',
  description: 'Create a new organization to manage events',
};

const CreateOrganizationPage = async () => {
  return (
    <div className='w-full flex flex-col items-center gap-8'>
      <h1 className='text-2xl font-bold text-center'>Create New Organization</h1>
      <OrganizationForm />
    </div>
  );
};

export default CreateOrganizationPage;
