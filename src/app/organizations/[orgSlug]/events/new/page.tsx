import CreateEventPage from '@/components/organization/CreateEventPage';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { getOrgPageProps } from '@/services/getOrgPageProps';
import { Metadata } from 'next';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Create New Event—Rosterize',
};

const CreateEvent = async ({ params }: { params: Promise<{ orgSlug: string }> }) => {
  const { orgSlug } = await params;
  try {
    const orgData = await getOrgPageProps(orgSlug);
    if (!orgData) {
      return <p>Organization Not found</p>;
    }
    return (
      <CreateEventPage orgSlug={orgData.slug} orgName={orgData.name} orgOwnerId={orgData.ownerId} />
    );
  } catch (err: unknown) {
    return <ErrorMessage />;
  }
};

export default CreateEvent;
