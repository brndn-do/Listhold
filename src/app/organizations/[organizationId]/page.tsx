import { getOrganizationNameAndDescById } from '@/services/server-only/organizationNameAndDescService';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface OrganizationPageProps {
  params: Promise<{ organizationId: string }>;
}

// Dynamic metadata for Next.js App Router
export async function generateMetadata({ params }: OrganizationPageProps): Promise<Metadata> {
  const { organizationId } = await params;
  try {
    const result = await getOrganizationNameAndDescById(organizationId);

    // check if null
    if (!result) {
      return notFound();
    }

    // extract name and desc
    const { name, description } = result;

    return description
      ? {
          title: `${name} — Rosterize`,
          description: description,
        }
      : { title: `${name} — Rosterize` };
  } catch (err) {
    console.log('Error fetching organization name and description', err);
    throw err;
  }
}

export default async function OrganizationPage({ params }: OrganizationPageProps) {
  const { organizationId } = await params;
  try {
    const result = await getOrganizationNameAndDescById(organizationId);

    // check if null
    if (!result) {
      return notFound();
    }

    // extract name and desc
    const { name, description } = result;

    return (
      <div className='flex flex-col p-8'>
        <h1 className='text-2xl font-bold'>{name}</h1>
        {description && <p>{description}</p>}
      </div>
    );
  } catch (err) {
    console.log('Error fetching organization name and description', err);
    throw err;
  }
}
