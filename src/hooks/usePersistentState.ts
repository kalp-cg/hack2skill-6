import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import { readJson, writeJson } from '../lib/storage';

/**
 * `useState` backed by localStorage. `normalize` repairs or upgrades whatever was stored
 * (e.g. an unknown language code) before it reaches the UI.
 */
export function usePersistentState<T>(
  key: string,
  fallback: T,
  normalize: (stored: T) => T = (stored) => stored
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => normalize(readJson(key, fallback)));
  useEffect(() => writeJson(key, value), [key, value]);
  return [value, setValue];
}
