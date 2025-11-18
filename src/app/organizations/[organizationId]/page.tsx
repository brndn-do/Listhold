import { getOrganizationById, getOwnerNameById } from '@/services/server-only/organizationService';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface OrganizationPageProps {
  params: Promise<{ organizationId: string }>;
}

// Dynamic metadata for Next.js App Router
export async function generateMetadata({ params }: OrganizationPageProps): Promise<Metadata> {
  const { organizationId } = await params;
  try {
    const result = await getOrganizationById(organizationId);

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
    const org = await getOrganizationById(organizationId);

    // check if null
    if (!org) {
      return notFound();
    }

    // extract name and desc
    const { name, description, ownerId } = org;

    const ownerName = await getOwnerNameById(ownerId);

    return (
      <div className='flex flex-col p-8 gap-2 items-center'>
        <h1 className='text-2xl font-bold'>{name}</h1>
        <p>Owner: {ownerName}</p>
        {description && <p>{description}</p>}
      </div>
    );
  } catch (err) {
    console.log('Error fetching organization name and description', err);
    throw err;
  }
}
