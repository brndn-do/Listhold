import { Timestamp } from 'firebase/firestore';

/**
 * Represents a Firestore signup document
 */
export default interface SignupData {
  displayName: string;
  signupTime: Timestamp;
  photoURL: string | null;
  email: string;
  answers: Record<string, boolean | null>;
}
