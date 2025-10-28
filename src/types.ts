import { Timestamp } from 'firebase/firestore';

/**
 * Represents a Firestore signup document, with user's UID.
 */
export interface SignupData {
  uid: string;
  displayName: string;
  signupTime: Timestamp;

  // eslint-disable-next-line
  answers?: Record<string, any>;
}

/**
 * Represents a Firestore event document, with document ID.
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
  signupsCount: number;

  // Future feat
  // eslint-disable-next-line
  rules?: Record<string, any>;

  // subcollection: questions
}

/**
 * Represents a Firestore user document with document ID.
 */
export interface UserData {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  lastLogin: Timestamp;
}
