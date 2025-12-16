import OrgForm from '@/components/organization/OrgForm';
import { Metadata } from 'next';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Create Organization—Rosterize',
  description: 'Create a new organization to manage events',
};

const CreateOrganizationPage = async () => {
  return (
    <div className='w-full flex flex-col items-center gap-8'>
      <h1 className='text-2xl font-bold text-center'>Create New Organization</h1>
      <OrgForm />
    </div>
  );
};

export default CreateOrganizationPage;
