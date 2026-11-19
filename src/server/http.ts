import type { ErrorRequestHandler, RequestHandler } from 'express';
import { RATE_LIMIT, UPSTREAM_TIMEOUT_MS } from './config.js';
import { SlidingWindowRateLimiter } from './security.js';

const limiter = new SlidingWindowRateLimiter(RATE_LIMIT);

/**
 * Per-client, per-scope rate limit. The key uses `req.ip`, which only honours X-Forwarded-For for
 * the configured trusted proxy hops, so a forged header cannot reset a client's bucket.
 */
export function rateLimit(scope: string, message: string): RequestHandler {
  return (req, res, next) => {
    const result = limiter.check(`${scope}:${req.ip || 'unknown'}`);
    if (result.allowed) {
      next();
      return;
    }
    res.setHeader('Retry-After', String(result.retryAfterSec));
    res.status(429).json({ error: message });
  };
}

/** GETs JSON from an upstream API with a hard timeout; rejects on network errors and non-2xx responses. */
export async function fetchJson<T>(
  url: string,
  { timeoutMs = UPSTREAM_TIMEOUT_MS, headers }: { timeoutMs?: number; headers?: Record<string, string> } = {}
): Promise<T> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: { Accept: 'application/json', ...headers },
  });
  if (!response.ok) throw new Error(`Upstream ${new URL(url).host} responded ${response.status}`);
  return (await response.json()) as T;
}

/** JSON errors for body-parser failures (bad JSON, oversized body); never echoes stack traces. */
export const jsonErrorHandler: ErrorRequestHandler = (err: { status?: number }, _req, res, _next) => {
  const status = typeof err?.status === 'number' && err.status >= 400 && err.status < 600 ? err.status : 500;
  const message =
    status === 413 ? 'Request body too large.' : status < 500 ? 'Malformed request.' : 'Internal server error.';
  res.status(status).json({ error: message });
};
