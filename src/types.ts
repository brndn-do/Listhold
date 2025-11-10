import { Timestamp } from 'firebase/firestore';

/**
 * Represents a Firestore prompt document, with document ID.
 */
export interface PromptData {
  id: string;
  order: number; // The order the prompt shows up e.g., 1, 2, 3... to define the sequence
  type: 'yes/no' | 'text' | 'select' | 'checkbox' | 'notice';
  text: string;
  options?: string[]; // list of options for select/checkbox questions
  validation?: {
    // optional: requiring a specific answer to this prompt for signup
    valid: // the correct answer to expect
    | boolean /* yes/no question can only have one correct boolean answer */
      | string /* select question can only have one correct string answer */
      | string[] /* a checkbox question can have a single combination of string options that is correct */
      | string[][] /* a checkbox question can have multiple combinations of string options that are correct */;
    errorMessage?: string; // custon error message for the user if they fail validation
  };
}

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
