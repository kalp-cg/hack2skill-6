import { GoogleGenAI } from '@google/genai';
import { GEMINI_ATTEMPT_TIMEOUT_MS, GEMINI_FALLBACK_MODEL, GEMINI_PRIMARY_MODEL } from './config.js';

type GenerateContentParams = { contents: string; config?: Record<string, unknown> };
type GeminiModels = Pick<GoogleGenAI, 'models'>;

class AttemptTimeoutError extends Error {}

const errorText = (err: unknown) => (err instanceof Error ? err.message : String(err));

function isTransientError(err: unknown): boolean {
  return /\b(500|503)\b|UNAVAILABLE|INTERNAL|high demand|ECONNRESET/.test(errorText(err));
}

function isQuotaError(err: unknown): boolean {
  return /\b429\b|RESOURCE_EXHAUSTED/.test(errorText(err));
}

/** Builds the server-side client. The key never leaves the server. */
export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured (set it in .env or the hosting environment).');
  }
  return new GoogleGenAI({ apiKey });
}

/** Rejects after `ms`, aborting the in-flight request so it stops consuming a connection. */
function withTimeout<T>(run: (signal: AbortSignal) => Promise<T>, ms: number, model: string): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new AttemptTimeoutError(`Gemini ${model} timed out after ${ms} ms`));
    }, ms);
  });
  return Promise.race([run(controller.signal), timeout]).finally(() => clearTimeout(timer));
}

/**
 * Calls Gemini with a short retry policy: a transient 5xx is retried once on the primary model;
 * a quota error or a stalled request moves straight to the fallback model, because quotas and
 * load are tracked per model and the fallback usually still has headroom.
 */
export async function generateContentWithResilience(
  ai: GeminiModels,
  params: GenerateContentParams,
  attemptTimeoutMs = GEMINI_ATTEMPT_TIMEOUT_MS
) {
  const attempts = [
    { model: GEMINI_PRIMARY_MODEL, delayMs: 0 },
    { model: GEMINI_PRIMARY_MODEL, delayMs: 850 },
    { model: GEMINI_FALLBACK_MODEL, delayMs: 350 },
  ];
  const exhaustedModels = new Set<string>();
  let lastError: unknown;

  for (const { model, delayMs } of attempts) {
    if (exhaustedModels.has(model)) continue;
    if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
    try {
      return await withTimeout(
        (abortSignal) =>
          ai.models.generateContent({ model, contents: params.contents, config: { ...params.config, abortSignal } }),
        attemptTimeoutMs,
        model
      );
    } catch (err) {
      lastError = err;
      if (isQuotaError(err) || err instanceof AttemptTimeoutError) {
        exhaustedModels.add(model);
      } else if (!isTransientError(err)) {
        throw err;
      }
    }
  }
  throw lastError;
}

/** Maps a Gemini failure to an HTTP status and a message that is safe to show users. */
export function geminiErrorToHttp(err: unknown): { status: number; message: string } {
  const raw = errorText(err);
  if (raw.includes('GEMINI_API_KEY')) return { status: 503, message: raw };
  if (/API_KEY_INVALID|PERMISSION_DENIED|\b403\b/.test(raw)) {
    return { status: 403, message: 'Gemini API authentication failed. Check the server GEMINI_API_KEY.' };
  }
  if (isQuotaError(err)) return { status: 429, message: 'Rate limit reached on Gemini API. Please retry shortly.' };
  if (isTransientError(err) || err instanceof AttemptTimeoutError) {
    return { status: 503, message: 'Gemini AI is experiencing a temporary traffic spike. Please retry.' };
  }
  return { status: 502, message: 'The AI service returned an unexpected error. Please retry.' };
}
