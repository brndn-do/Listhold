import OrgPage from '@/components/organization/OrgPage';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { getEventsByOrgId } from '@/services/TODO/getEventsByOrgId';
import { getOrgBySlug } from '@/services/getOrgBySlug';
import { EventData } from '@/types/clientEventData';
import { WithId } from '@/types/withId';
import { Metadata } from 'next';

export const revalidate = 60;

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}): Promise<Metadata> => {
  const { orgSlug } = await params;
  try {
    const orgData = await getOrgBySlug(orgSlug);
    if (!orgData) {
      return {
        title: 'Organization Not Found — Rosterize',
        description: 'The requested organization could not be found.',
      };
    }
    return {
      title: `${orgData.name} — Rosterize`,
      description: orgData.description || `View ${orgData.name} on Rosterize.`,
    };
  } catch (err: unknown) {
    return {
      title: 'Error — Rosterize',
    };
  }
};

const Organization = async ({ params }: { params: Promise<{ orgSlug: string }> }) => {
  const { orgSlug } = await params;
  try {
    const orgData = await getOrgBySlug(orgSlug);
    if (!orgData) {
      return <p>Not found</p>;
    }
    const events: WithId<EventData>[] = await getEventsByOrgId(orgSlug);
    return <OrgPage orgData={orgData} events={events} />;
  } catch (err: unknown) {
    return <ErrorMessage />;
  }
};

export default Organization;
