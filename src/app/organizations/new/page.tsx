import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';
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
      <form className='max-w-md mx-auto'>
        <div className='grid md:grid-cols-2 md:gap-6'>
          <FormInput id='organizationId' required={false} text='A unique ID'/>
          <FormInput id='organizationName' required={true} text='Name'/>
        </div>
        <div>
          <FormInput id='organizationDescription' required={false} text='Description'></FormInput>
        </div>
        <Button content='Submit'/>
      </form>
    </div>
  );
}
