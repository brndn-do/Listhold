export interface EventData {
  name: string;
  description?: string;
  organizationId: string;
  organizationName: string;
  creatorId: string;
  location: string;
  start: Date;
  end?: Date;
  capacity: number;
  signupsCount: number;
  createdAt: Date;
}
