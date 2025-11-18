import { Timestamp } from 'firebase/firestore';

/**
 * Represents a Firestore organization document, with document ID.
 */
export interface OrganizationData {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
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
}

/**
 * Represents a Firestore prompt document, with document ID.
 */
export interface PromptData {
  id: string;
  order: number;
  type: 'notice' | 'yes/no';
  text: string;
  visibility?: 'public' | 'private'
}

/**
 * Represents a Firestore signup document, with user's UID.
 */
export interface SignupData {
  id: string;
  displayName: string;
  signupTime: Timestamp;
  photoURL: string | null;
  email: string;
  answers: Record<string, boolean | null>;
}

/**
 * Represents a Firestore user document with document ID.
 */
export interface UserData {
  id: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  lastLogin: Timestamp;
}