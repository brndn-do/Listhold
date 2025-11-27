/**
 * Represents a Firestore prompt document
 */
export interface PromptData {
  order: number;
  type: 'notice' | 'yes/no';
  text: string;
  visibility?: 'public' | 'private';
}
