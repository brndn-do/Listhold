/**
 * Represents a Firestore prompt document
 */
export default interface PromptData {
  order: number;
  type: 'notice' | 'yes/no';
  text: string;
  visibility?: 'public' | 'private';
}
