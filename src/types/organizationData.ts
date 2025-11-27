import { Timestamp } from 'firebase/firestore';

/**
 * Represents a Firestore organization document
 */
export default interface OrganizationData {
  name: string;
  description?: string;
  ownerId: string;
  createdAt: Timestamp;
}
