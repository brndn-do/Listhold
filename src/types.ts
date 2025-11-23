import { Timestamp } from 'firebase/firestore';

/**
 * A reusable helper type that includes an `id` field.
 * The `id` field represents the document ID in Firestore.
 */
export type WithId<T> = T & { id: string };

/**
 * Represents a Firestore organization document
 */
export interface OrganizationData {
  name: string;
  description?: string;
  ownerId: string;
  createdAt: Timestamp;
}

/**
 * Represents a Firestore event document
 */
export interface EventData {
  name: string;
  description?: string;
  organizationId: string;
  createdAt: Timestamp;
  creatorId: string;
  location: string;
  start: Timestamp;
  end: Timestamp;
  capacity: number;
  signupsCount: number;
}

/**
 * Represents a Firestore prompt document
 */
export interface PromptData {
  order: number;
  type: 'notice' | 'yes/no';
  text: string;
  visibility?: 'public' | 'private';
}

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

/**
 * Represents Firestore user document
 */
export interface UserData {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  lastLogin: Timestamp;
}
