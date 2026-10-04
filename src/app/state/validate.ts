/**
 * A tiny schema validator for imported and shared projects. Each check returns an error message
 * (with the path to the bad value) or null. Hand-written to keep the app dependency-free.
 */
export type Check = (value: unknown, path: string) => string | null;

const fail = (path: string, expected: string) => `${path}: expected ${expected}`;

export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export const str =
  (maxLength: number): Check =>
  (v, p) =>
    typeof v === 'string' && v.length <= maxLength
      ? null
      : fail(p, `text up to ${maxLength} characters`);

export const bool: Check = (v, p) => (typeof v === 'boolean' ? null : fail(p, 'true or false'));

export const num =
  (min = -1e6, max = 1e6): Check =>
  (v, p) =>
    typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max
      ? null
      : fail(p, `a number from ${min} to ${max}`);

export const oneOf =
  (options: readonly (string | number)[]): Check =>
  (v, p) =>
    (typeof v === 'string' || typeof v === 'number') && options.includes(v)
      ? null
      : fail(p, `one of ${options.join(', ')}`);

export const optional =
  (check: Check): Check =>
  (v, p) =>
    v === undefined ? null : check(v, p);

export const arr =
  (check: Check, maxLength: number, minLength = 0): Check =>
  (v, p) => {
    if (!Array.isArray(v)) return fail(p, 'a list');
    if (v.length > maxLength) return fail(p, `at most ${maxLength} items`);
    if (v.length < minLength) return fail(p, `at least ${minLength} items`);
    for (let i = 0; i < v.length; i++) {
      const error = check(v[i], `${p}[${i}]`);
      if (error) return error;
    }
    return null;
  };

/** Exactly `length` items (band values, ranges). */
export const tuple = (check: Check, length: number): Check => arr(check, length, length);

/** A [low, high] pair of numbers with low ≤ high. */
export const range =
  (check: Check): Check =>
  (v, p) => {
    const error = tuple(check, 2)(v, p);
    if (error) return error;
    const [lo, hi] = v as [number, number];
    return lo <= hi ? null : fail(p, 'a range from low to high');
  };

/**
 * A list of objects with distinct `id`s. The UI keys lists by id, and a duplicate would crash it
 * (R0 audit: a crafted share link with two setups of the same id blanked the app for good).
 */
export const distinctIds =
  (check: Check): Check =>
  (v, p) => {
    const error = check(v, p);
    if (error) return error;
    const ids = (v as { id: string }[]).map((item) => item.id);
    return new Set(ids).size === ids.length ? null : fail(p, 'items with different ids');
  };

/** Objects: every listed key is checked; unknown extra keys are ignored. */
export const obj =
  (shape: Record<string, Check>): Check =>
  (v, p) => {
    if (!isRecord(v)) return fail(p, 'an object');
    for (const [key, check] of Object.entries(shape)) {
      const error = check(v[key], `${p}.${key}`);
      if (error) return error;
    }
    return null;
  };

/**
 * An object whose every value passes `check`, with keys limited to `keys` (if given). With
 * `complete`, every one of `keys` must be present.
 */
export const record =
  (check: Check, keys?: readonly string[], options: { complete?: boolean } = {}): Check =>
  (v, p) => {
    if (!isRecord(v)) return fail(p, 'an object');
    for (const [key, value] of Object.entries(v)) {
      if (keys && !keys.includes(key)) return fail(`${p}.${key}`, 'a known key');
      const error = check(value, `${p}.${key}`);
      if (error) return error;
    }
    const missing = options.complete ? keys?.find((key) => !(key in v)) : undefined;
    return missing ? fail(`${p}.${missing}`, 'a value') : null;
  };

const CERTAINTIES = ['measured', 'estimated', 'unknown'] as const;

/** `Known<T>`: a value with its certainty; the value is null only when unknown. */
export const known =
  (check: Check): Check =>
  (v, p) => {
    if (!isRecord(v)) return fail(p, 'a value with its certainty');
    const certainty = oneOf(CERTAINTIES)(v.certainty, `${p}.certainty`);
    if (certainty) return certainty;
    if (v.value === null) return v.certainty === 'unknown' ? null : fail(`${p}.value`, 'a value');
    return check(v.value, `${p}.value`);
  };

export const vec3: Check = obj({ x: num(-100, 100), y: num(-100, 100), z: num(-100, 100) });
