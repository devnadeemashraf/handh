import { draftMode } from 'next/headers';

/**
 * Safely checks if Next.js Draft Mode is enabled.
 * Gracefully returns false when called outside an active Next.js request context
 * (e.g. during static generation or vitest unit tests).
 */
export async function isDraftModeEnabled(): Promise<boolean> {
  try {
    const draft = await draftMode();
    return draft.isEnabled;
  } catch {
    return false;
  }
}
