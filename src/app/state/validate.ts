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
  (check: Check, maxLength: number): Check =>
  (v, p) => {
    if (!Array.isArray(v)) return fail(p, 'a list');
    if (v.length > maxLength) return fail(p, `at most ${maxLength} items`);
    for (let i = 0; i < v.length; i++) {
      const error = check(v[i], `${p}[${i}]`);
      if (error) return error;
    }
    return null;
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

/** An object whose every value passes `check`, with keys limited to `keys` (if given). */
export const record =
  (check: Check, keys?: readonly string[]): Check =>
  (v, p) => {
    if (!isRecord(v)) return fail(p, 'an object');
    for (const [key, value] of Object.entries(v)) {
      if (keys && !keys.includes(key)) return fail(`${p}.${key}`, 'a known key');
      const error = check(value, `${p}.${key}`);
      if (error) return error;
    }
    return null;
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
