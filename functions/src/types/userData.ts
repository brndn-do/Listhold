import { Timestamp } from 'firebase-admin/firestore';

/**
 * Represents Firestore user document
 */
export interface UserData {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  lastLogin: Timestamp;
}
