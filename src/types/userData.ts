import { Timestamp } from 'firebase/firestore';

/**
 * Represents Firestore user document
 */
export default interface UserData {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  lastLogin: Timestamp;
}
