import { functions } from '@/lib/firebase';
import { FunctionsError, httpsCallable } from 'firebase/functions';

interface CreateOrgRequest {
  name: string;
  id?: string;
}

interface CreateOrgResult {
  organizationId: string;
  message: string;
}

const cloudFunction = httpsCallable<CreateOrgRequest, CreateOrgResult>(
  functions,
  'createOrganization',
);

/**
 * Creates an organization.
 * @param request - An object including the request details.
 * @returns The id of the newly created organization.
 * @throws if the cloud function errors.
 */
export const createOrg = async (request: CreateOrgRequest): Promise<string> => {
  try {
    const result = await cloudFunction(request);
    const data = result.data;
    return data.organizationId;
  } catch (err: unknown) {
    const firebaseError = err as FunctionsError;
    throw new Error(firebaseError.code);
  }
};
