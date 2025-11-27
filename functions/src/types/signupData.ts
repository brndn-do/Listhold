import { Timestamp } from 'firebase-admin/firestore';

/**
 * Represents a Firestore signup document
 */
export interface SignupData {
  displayName: string;
  signupTime: Timestamp;
  photoURL: string | null;
  email: string;
  answers: Record<string, boolean | null>;
}
