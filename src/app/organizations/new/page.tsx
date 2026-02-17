import OrgForm from '@/features/orgs/components/OrgForm';
import { Metadata } from 'next';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Create Organization — Listhold',
  description: 'Create a new organization to manage events',
};

const CreateOrganizationPage = async () => {
  return (
    <div className='flex w-full flex-col items-center gap-8'>
      <h1 className='text-center text-2xl font-bold'>Create New Organization</h1>
      <OrgForm />
    </div>
  );
};

export default CreateOrganizationPage;
