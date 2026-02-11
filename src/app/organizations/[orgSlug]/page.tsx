import NotFound from '@/app/not-found';
import OrgPage from '@/components/organization/OrgPage';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { getOrgBySlug } from '@/services/getOrgBySlug';
import { Metadata } from 'next';
import { cache } from 'react';

export const dynamic = 'force-static';
export const revalidate = 60;

const cachedGetOrgBySlug = cache(getOrgBySlug);

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}): Promise<Metadata> => {
  const { orgSlug } = await params;
  try {
    const props = await cachedGetOrgBySlug(orgSlug);
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
    const props = await cachedGetOrgBySlug(orgSlug);
    if (!props) {
      return <NotFound />;
    }
    return <OrgPage {...props} />;
  } catch (err: unknown) {
    return <ErrorMessage />;
  }
};

export default Organization;
