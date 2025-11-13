import { Timestamp } from 'firebase/firestore';

// stores the correct answer(s) for a prompt
type valid =
| boolean /* yes/no question can only have one correct boolean answer */
| string /* select question can only have one correct string answer */
| string[] /* a checkbox question can have a single combination of string options that is correct */
| string[][] /* a checkbox question can have multiple combinations of string options that are correct */;

// eslint-disable-next-line
interface FuturePromptData {
  id: string;
  order: number; // The order the prompt shows up e.g., 1, 2, 3... to define the sequence
  type: 'notice' | 'yes/no' | 'text' | 'select' | 'checkbox' | 'notice';
  text: string;
  visibility?: 'public' | 'private'; // Whether a user's answer to a non-notice prompt can be shown publicly or only to admins/authorized users
  options?: string[]; // list of options for select/checkbox questions
  
  // requiring a specific answer to this prompt for signup
  validation?: {
    valid: valid;
    errorMessage?: string; // custon error message for the user if they fail validation
  };
  
  // choose whether or not this prompt appears based on a previous answer
  displayCondition?: {
    promptId: string; // The ID of the prompt this one depends on
    valid: valid;
  };
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
  id: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  lastLogin: Timestamp;
}
