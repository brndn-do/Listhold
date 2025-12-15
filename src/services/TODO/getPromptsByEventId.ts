import 'server-only';

import { PromptData } from '@/types/promptData';
import { adminDb } from '@/lib/firebase-admin';

/**
 * Fetches an event's prompts.
 * @param eventId - The event's unique identifier.
 * @returns A Promise that resolves to a mapping of each prompt's ID to its data.
 */
export const getPromptsByEventId = async (eventId: string): Promise<Record<string, PromptData>> => {
  const ref = adminDb.collection(`events/${eventId}/prompts`);

  const snap = await ref.orderBy('order').get();

  // map prompts
  const prompts: Record<string, PromptData> = snap?.docs.reduce<Record<string, PromptData>>(
    (acc, promptDoc) => {
      acc[promptDoc.id] = promptDoc.data() as PromptData;
      return acc;
    },
    {},
  );
  return prompts;
};
