/**
 * A reusable helper type that includes an `id` field.
 * The `id` field represents the document ID in Firestore.
 */
export type WithId<T> = T & { id: string };
