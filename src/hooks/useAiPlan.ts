import { useState } from 'react';
import { requestAiPlan } from '../lib/api';
import { readJson, STORAGE_KEYS, writeJson } from '../lib/storage';
import type { DailyPlanData, SituationObject } from '../types/saans';

/** The Gemini-personalized plan. While it is null, the UI shows the deterministic engine plan. */
export function useAiPlan() {
  const [aiPlan, setAiPlan] = useState<DailyPlanData | null>(() =>
    readJson<DailyPlanData | null>(STORAGE_KEYS.cachedPlan, null)
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate(situation: SituationObject) {
    setIsGenerating(true);
    setError(null);
    try {
      const plan = await requestAiPlan(situation);
      setAiPlan(plan);
      writeJson(STORAGE_KEYS.cachedPlan, plan);
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Unable to reach the AI planner.';
      setError(`${reason} Showing deterministic engine plan below.`);
    } finally {
      setIsGenerating(false);
    }
  }

  /** Drops the AI plan so the deterministic plan (which reacts instantly to feedback) is shown. */
  const reset = () => setAiPlan(null);

  return { aiPlan, isGenerating, error, generate, reset };
}
