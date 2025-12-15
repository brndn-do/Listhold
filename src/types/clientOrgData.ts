// Organization Data that the client needs
export interface ClientOrgData {
  slug: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: Date;
}
