import { Timestamp } from 'firebase-admin/firestore';

/**
 * Represents a Firestore organization document
 */
export interface OrganizationData {
  name: string;
  description?: string;
  ownerId: string;
  createdAt: Timestamp;
}
