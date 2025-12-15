export interface ClientEventData {
  id: string;
  slug: string;
  name: string;
  description?: string;
  orgSlug: string;
  orgName: string;
  creatorId: string;
  location: string;
  start: Date;
  end?: Date;
  capacity: number;
  createdAt: Date;
}
