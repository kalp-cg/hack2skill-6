/** localStorage keys; the `_v1` suffix lets a future schema change start fresh instead of misreading old data. */
export const STORAGE_KEYS = {
  profile: 'saans_profile_v1',
  lang: 'saans_lang_v1',
  feedback: 'saans_feedback_v1',
  streak: 'saans_streak_v1',
  dark: 'saans_dark_v1',
  largeText: 'saans_large_v1',
  highContrast: 'saans_contrast_v1',
  cachedAir: 'saans_cached_air_v1',
  cachedPlan: 'saans_cached_plan_v1',
} as const;

/** Reads a JSON value; storage can be unavailable (private mode) or corrupted, so it never throws. */
export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Writes a JSON value; quota or private-mode failures are ignored because the cache is best-effort. */
export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Best-effort cache: the app works without it.
  }
}
