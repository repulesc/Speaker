/** Random identifier for projects, variants and patches. */
export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Current time as an ISO string. */
export const nowIso = (): string => new Date().toISOString();
