import type { NextFunction, Request, Response } from 'express';

/** ASCII control characters except tab (\u0009), newline (\u000A) and carriage return (\u000D). */
// biome-ignore lint/suspicious/noControlCharactersInRegex: matching control characters is the point — they are stripped.
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/**
 * Strips control characters and trims user text
 * to prevent log injection, malformed payloads, and prompt-stuffing bloat.
 */
export function sanitizeUserText(raw: unknown, maxLength = 800): string {
  const str = String(raw ?? '')
    .replace(CONTROL_CHARACTERS, '')
    .trim();
  return str.length > maxLength ? str.slice(0, maxLength) : str;
}

/** Sanitized short display label (names, cities) with HTML angle brackets removed. */
export function sanitizeLabel(raw: unknown, fallback: string, maxLength = 40): string {
  const cleaned = sanitizeUserText(raw, maxLength).replace(/[<>]/g, '');
  return cleaned || fallback;
}

/** Coerces untrusted input to an integer within [min, max], using `fallback` when it is not a number. */
export function clampInt(raw: unknown, fallback: number, min: number, max: number): number {
  const value = Number(raw ?? fallback);
  return Math.max(min, Math.min(max, Math.round(Number.isFinite(value) ? value : fallback)));
}

/**
 * Validates geographic latitude (-90..90) and longitude (-180..180).
 */
export function validateCoordinates(
  latRaw: unknown,
  lonRaw: unknown
): { ok: true; lat: number; lon: number } | { ok: false; error: string } {
  const lat = Number(latRaw);
  const lon = Number(lonRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { ok: false, error: 'Valid numeric lat and lon parameters are required.' };
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return { ok: false, error: 'Coordinates out of valid geographic bounds.' };
  }
  return { ok: true, lat, lon };
}

/**
 * Validates city/area search query strings for /api/geocode.
 */
export function validateGeocodeQuery(raw: unknown): { ok: true; query: string } | { ok: false; error: string } {
  const cleaned = sanitizeUserText(raw, 80).replace(/[<>`]/g, '');
  if (cleaned.length < 2) {
    return { ok: false, error: 'Enter at least 2 characters to search.' };
  }
  return { ok: true, query: cleaned };
}

/**
 * Validates and sanitizes community/RWA/school circle names (strips HTML angle brackets).
 */
export function validateCommunityName(raw: unknown): { ok: true; name: string } | { ok: false; error: string } {
  const cleaned = sanitizeUserText(raw, 60).replace(/[<>]/g, '');
  if (cleaned.length < 3) {
    return { ok: false, error: 'Community name must be between 3 and 60 characters.' };
  }
  return { ok: true, name: cleaned };
}

/**
 * Defense-in-depth HTTP security headers middleware compatible with embedded previews & PWA.
 */
export function applySecurityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), payment=(), usb=()');
  res.setHeader('X-XSS-Protection', '0');
  next();
}

/**
 * Memory-bounded sliding-window rate limiter (per-IP key).
 * Prevents abusive bursts against AI and community mutation endpoints without unbounded RAM growth.
 */
export class SlidingWindowRateLimiter {
  private readonly buckets = new Map<string, number[]>();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly maxKeys: number;

  constructor(options: { maxRequests: number; windowMs: number; maxKeys?: number }) {
    this.maxRequests = options.maxRequests;
    this.windowMs = options.windowMs;
    this.maxKeys = options.maxKeys ?? 1000;
  }

  check(key: string, now = Date.now()): { allowed: boolean; retryAfterSec: number; remaining: number } {
    const cutoff = now - this.windowMs;
    const existing = this.buckets.get(key) ?? [];
    const recent = existing.filter((ts) => ts > cutoff);

    if (recent.length >= this.maxRequests) {
      const oldest = recent[0];
      const retryAfterSec = Math.max(1, Math.ceil((oldest + this.windowMs - now) / 1000));
      this.buckets.set(key, recent);
      return { allowed: false, retryAfterSec, remaining: 0 };
    }

    recent.push(now);
    this.buckets.delete(key);
    this.buckets.set(key, recent);

    // Bounded memory eviction if too many distinct IPs accumulate
    if (this.buckets.size > this.maxKeys) {
      const firstKey = this.buckets.keys().next().value;
      if (firstKey !== undefined) {
        this.buckets.delete(firstKey);
      }
    }

    return {
      allowed: true,
      retryAfterSec: 0,
      remaining: Math.max(0, this.maxRequests - recent.length),
    };
  }
}
