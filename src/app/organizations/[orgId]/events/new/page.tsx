import CreateEventPage from '@/components/organization/CreateEventPage';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { getOrgById } from '@/services/getOrgById';
import { OrganizationData } from '@/types/organizationData';
import { WithId } from '@/types/withId';
import { Metadata } from 'next';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Create New Event—Rosterize',
};

const CreateEvent = async ({ params }: { params: Promise<{ orgId: string }> }) => {
  const { orgId } = await params;
  try {
    const orgData: WithId<OrganizationData> | null = await getOrgById(orgId);
    if (!orgData) {
      return <p>Organization Not found</p>;
    }
    return <CreateEventPage orgData={orgData} />;
  } catch (err: unknown) {
    return <ErrorMessage />;
  }
};

export default CreateEvent;
