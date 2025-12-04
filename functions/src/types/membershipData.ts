/**
 * Represents a Firestore membership document
 */
export interface MembershipData {
  organizationName: string;
  role: 'member' | 'admin' | 'owner';
}
