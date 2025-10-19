import { Timestamp } from 'firebase/firestore';

/**
 * Represents a Firestore event document including the document ID as a field.
 */
export interface EventData {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  location: string;
  start: Timestamp;
  end: Timestamp;
  capacity: number;

  // Future feat
  // eslint-disable-next-line
  rules?: Record<string, any>;

  // subcollection: questions
}

/**
 * Represents a Firestore user document including the document ID as a field.
 */
export interface UserData {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  lastLogin: Timestamp;
}
