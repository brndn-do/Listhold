/**
 * A reusable helper type that includes an `id` field.
 * The `id` field represents the document ID in Firestore.
 */
type WithId<T> = T & { id: string };

export default WithId;
