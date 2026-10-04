/** Hard bounds for user input and imported data (docs/UI_SPEC.md §6, step 1). */
export const ROOM_LIMITS = {
  width: { min: 1.5, max: 30 },
  length: { min: 1.5, max: 30 },
  height: { min: 1.8, max: 8 },
} as const;

/** Outside these ranges the field shows a soft "Is that right?" warning but accepts the value. */
export const USUAL_ROOM_RANGE = {
  width: { min: 2, max: 12 },
  length: { min: 2, max: 12 },
  height: { min: 2.2, max: 4 },
} as const;

/** Size caps keep hostile or corrupt files from making the engine or the browser crawl. */
export const SIZE_LIMITS = {
  fileBytes: 1_000_000,
  shareChars: 20_000,
  name: 200,
  text: 2_000,
  patches: 200,
  objects: 200,
  variants: 20,
  notes: 1_000,
  projects: 50,
} as const;
