import { Timestamp } from 'firebase-admin/firestore';

/**
 * Represents a Firestore event document
 */
export interface EventData {
  name: string;
  description?: string;
  organizationId: string;
  organizationName: string;
  creatorId: string;
  location: string;
  start: Timestamp;
  end: Timestamp;
  capacity: number;
  signupsCount: number;
  createdAt: Timestamp;
}
