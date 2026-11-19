/** Server tunables in one place. Limits are deliberately small: the API runs on free-tier serverless. */

export const BODY_LIMIT = '32kb';

/**
 * Express `trust proxy` hops. Vercel's edge overwrites X-Forwarded-For, so 1 hop is safe there;
 * locally it is 0, so a spoofed header can never change the client IP used for rate limiting.
 */
export const TRUST_PROXY_HOPS = Number(process.env.TRUST_PROXY_HOPS ?? (process.env.VERCEL ? 1 : 0));

/** Shared limit for the AI and mutation routes: requests per client IP per window. */
export const RATE_LIMIT = { maxRequests: 30, windowMs: 60_000, maxKeys: 500 };

export const UPSTREAM_TIMEOUT_MS = 6_000;
export const AQI_CACHE = { maxEntries: 100, ttlMs: 10 * 60_000 };
export const GEOCODE_CACHE = { maxEntries: 100, ttlMs: 30 * 60_000 };

export const MAX_COMMUNITY_GROUPS = 50;
export const MAX_LEADERBOARD_ENTRIES = 20;

/** Upper bound on the client-built situation object embedded in a prompt. */
export const MAX_SITUATION_CHARS = 16_000;
export const MAX_QUESTION_CHARS = 800;
export const MAX_HISTORY_TURNS = 6;
export const MAX_HISTORY_TURN_CHARS = 500;

export const GEMINI_PRIMARY_MODEL = 'gemini-4-hydrogen';
export const GEMINI_FALLBACK_MODEL = 'gemini-3.1-flash-lite';

/** Per-attempt budget: a primary and a fallback attempt must both fit in the 60 s function limit. */
export const GEMINI_ATTEMPT_TIMEOUT_MS = 22_000;
