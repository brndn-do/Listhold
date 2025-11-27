import { Timestamp } from 'firebase/firestore';

/**
 * Represents a Firestore event document
 */
export default interface EventData {
  name: string;
  description?: string;
  organizationId: string;
  organizationName: string;
  creatorId: string;
  creatorName: string;
  location: string;
  start: Timestamp;
  end: Timestamp;
  capacity: number;
  signupsCount: number;
  createdAt: Timestamp;
}
