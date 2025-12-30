import OrgPage from '@/components/organization/OrgPage';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { getOrgPageProps } from '@/services/getOrgPageProps';
import { Metadata } from 'next';

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}): Promise<Metadata> => {
  const { orgSlug } = await params;
  try {
    const props = await getOrgPageProps(orgSlug);
    if (!props) {
      return {
        title: 'Organization Not Found — Rosterize',
        description: 'The requested organization could not be found.',
      };
    }
    return {
      title: `${props.name} — Rosterize`,
      description: props.description || `View ${props.name} on Rosterize.`,
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
    const props = await getOrgPageProps(orgSlug);
    if (!props) {
      return <p>Not found</p>;
    }
    return <OrgPage {...props} />;
  } catch (err: unknown) {
    return <ErrorMessage />;
  }
};

export default Organization;
