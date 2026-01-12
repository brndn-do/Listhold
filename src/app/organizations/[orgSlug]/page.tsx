import NotFound from '@/app/not-found';
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
        title: 'Organization Not Found — Listhold',
        description: 'The requested organization could not be found.',
      };
    }
    return {
      title: `${props.name} — Listhold`,
      description: props.description || `View ${props.name} on Listhold.`,
    };
  } catch (err: unknown) {
    return {
      title: 'Error — Listhold',
    };
  }
};

const Organization = async ({ params }: { params: Promise<{ orgSlug: string }> }) => {
  const { orgSlug } = await params;
  try {
    const props = await getOrgPageProps(orgSlug);
    if (!props) {
      return <NotFound />;
    }
    return <OrgPage {...props} />;
  } catch (err: unknown) {
    return <ErrorMessage />;
  }
};

export default Organization;
