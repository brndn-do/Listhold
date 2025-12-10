import OrgPage from '@/components/organization/OrgPage';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { getEventsByOrgId } from '@/services/getEventsByOrgId';
import { getOrgById } from '@/services/getOrgById';
import { EventData } from '@/types/eventData';
import { OrganizationData } from '@/types/organizationData';
import { WithId } from '@/types/withId';

export const revalidate = 60;

export const generateMetadata = async ({ params }: { params: Promise<{ orgId: string }> }) => {
  const { orgId } = await params;
  try {
    const orgData: WithId<OrganizationData> | null = await getOrgById(orgId);
    if (!orgData) {
      return {
        title: 'Organization Not Found — Rosterize',
        description: 'The requested organization could not be found.',
      };
    }
    return {
      title: `${orgData.name} — Rosterize`,
      description: orgData.description || `View ${orgData.name} on Rosterize.`
    }
  } catch (err: unknown) {
    return <ErrorMessage />;
  }
};

const Organization = async ({ params }: { params: Promise<{ orgId: string }> }) => {
  const { orgId } = await params;
  try {
    const orgData: WithId<OrganizationData> | null = await getOrgById(orgId);
    if (!orgData) {
      return <p>Not found</p>;
    }
    const events: WithId<EventData>[] = await getEventsByOrgId(orgId);
    return <OrgPage orgData={orgData} events={events} />;
  } catch (err: unknown) {
    return <ErrorMessage />;
  }
};

export default Organization;
