import confetti from 'canvas-confetti';
import { STORAGE_KEYS } from '../lib/storage';
import type { ActionFeedbackState } from '../types/saans';
import { usePersistentState } from './usePersistentState';

const EMPTY_FEEDBACK: ActionFeedbackState = { doneIds: [], skippedIds: [], thumbs: {} };
const STARTING_STREAK_DAYS = 3;

function celebrate() {
  try {
    confetti({ particleCount: 55, spread: 60, origin: { y: 0.72 } });
  } catch {
    // Canvas can be unavailable (headless browsers, strict privacy modes); the celebration is optional.
  }
}

/** Done / skipped / thumbs feedback on plan actions, plus the daily streak. Both persist across visits. */
export function useActionFeedback() {
  const [feedback, setFeedback] = usePersistentState(STORAGE_KEYS.feedback, EMPTY_FEEDBACK);
  const [streakDays, setStreakDays] = usePersistentState(STORAGE_KEYS.streak, STARTING_STREAK_DAYS);

  function markDone(actionId: string) {
    if (!feedback.doneIds.includes(actionId)) {
      celebrate();
      // The first completed action of the day extends the streak.
      if (feedback.doneIds.length === 0) setStreakDays((days) => days + 1);
    }
    setFeedback((previous) => ({
      ...previous,
      doneIds: previous.doneIds.includes(actionId) ? previous.doneIds : [...previous.doneIds, actionId],
      skippedIds: previous.skippedIds.filter((id) => id !== actionId),
    }));
  }

  function markSkipped(actionId: string) {
    setFeedback((previous) => ({
      ...previous,
      doneIds: previous.doneIds.filter((id) => id !== actionId),
      skippedIds: previous.skippedIds.includes(actionId) ? previous.skippedIds : [...previous.skippedIds, actionId],
    }));
  }

  function vote(actionId: string, value: 'up' | 'down') {
    setFeedback((previous) => ({ ...previous, thumbs: { ...previous.thumbs, [actionId]: value } }));
  }

  return { feedback, streakDays, markDone, markSkipped, vote };
}
