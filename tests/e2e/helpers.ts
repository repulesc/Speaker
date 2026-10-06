import type { Page } from '@playwright/test';

/** The first-run survey opens on a welcome card; "Start" moves on to the first question. */
export async function startSurvey(page: Page) {
  const start = page.getByRole('dialog').getByRole('button', { name: 'Start', exact: true });
  if (await start.count()) await start.click();
}

/**
 * Fills the three room fields (English labels) and moves focus away so the values commit. On a
 * new project they are the survey's first screen; the rest of the survey is skipped (defaults:
 * speakers only, seat fixed), unless `goal` picks what to work out on its second screen.
 */
export async function fillRoom(
  page: Page,
  width: string,
  length: string,
  height: string,
  goal?: 'Where to put my speakers' | 'Where to sit' | 'Both',
) {
  await startSurvey(page);
  await page.getByLabel('Width', { exact: true }).fill(width);
  await page.getByLabel('Length', { exact: true }).fill(length);
  await page.getByLabel('Ceiling height').fill(height);
  await page.getByLabel('Ceiling height').blur();
  const survey = page.getByRole('dialog', { name: 'How big is your room?' });
  if (await survey.count()) {
    if (goal) {
      await page.getByRole('button', { name: 'Next' }).click();
      await page.getByRole('radio', { name: new RegExp(`^${goal}`) }).check({ force: true });
    }
    await page.getByRole('button', { name: 'Skip' }).click();
    await page.locator('.app.reveal').waitFor({ state: 'detached' });
  }
}

/** Opens the app; on a new project the first-run survey is skipped (tests of it open it). */
export async function openApp(page: Page, path = '/') {
  await page.goto(path);
  const skip = page.getByRole('dialog').getByRole('button', { name: /^(Skip|Kihagyom)$/ });
  if (await skip.count()) {
    await skip.click();
    // The room fades in once after the survey; wait until it is fully shown.
    await page.locator('.app.reveal').waitFor({ state: 'detached' });
  }
}

/** The project JSON as saved in localStorage (waits for the autosave first). */
export async function savedProject(page: Page) {
  await page.getByText('Saved on this device').waitFor();
  return page.evaluate(() => {
    const id = localStorage.getItem('spa:active');
    return JSON.parse(localStorage.getItem(`spa:project:${id}`) ?? 'null');
  });
}

export async function openMenu(page: Page) {
  await page.getByRole('button', { name: 'Settings' }).click();
}

/** One of the panel's three steps (docs/ROADMAP_V8.md): Set up, Place, Listen. */
export async function openStep(page: Page, step: 'setup' | 'place' | 'listen') {
  await page.locator(`#step-${step}`).click();
}

/** The panel's home since V8: the Place step (the answer). */
export async function goHome(page: Page) {
  await openStep(page, 'place');
}

/** Opens a fold (a <details>) unless it is open already. */
async function unfold(page: Page, selector: string) {
  const details = page.locator(selector).first();
  if (!(await details.evaluate((d) => (d as HTMLDetailsElement).open))) {
    await details.locator('summary').first().click();
  }
}

/**
 * The V6 tab names, kept so the journeys read the same: the result is Place, the reasons are
 * Place's "The details", the tips are Listen's "Ideas for the room".
 */
export async function openTab(page: Page, name: 'Result' | 'Why' | 'Tips') {
  if (name === 'Tips') {
    await openStep(page, 'listen');
    await unfold(page, 'details.room-ideas');
    return;
  }
  await openStep(page, 'place');
  if (name === 'Why') await unfold(page, 'details.details');
}

const TABS: Record<string, 'Why' | 'Tips'> = {
  'Why this result': 'Why',
  'Bass at your seat': 'Why',
  'Improve the room': 'Tips',
};

/** Where a section of the old settings lives in Set up: a group, or a fold inside one. */
const SECTION_FOLD: Record<string, string | null> = {
  Room: null,
  Surfaces: '#setup-room-more',
  Furniture: '#setup-room-more',
  Speakers: null,
  Goals: '#setup-listen-more',
};

/** Opens a section: a group of Set up, a part of Place or Listen, or the listening check. */
export async function openSection(page: Page, name: string) {
  if (TABS[name]) return openTab(page, TABS[name]);
  if (name === 'Listening notes') return openStep(page, 'listen');
  await openSettings(page);
  const fold = SECTION_FOLD[name];
  if (fold) await unfold(page, fold);
  // The old Speakers page had every speaker field: open the fold that holds the rest.
  if (name === 'Speakers') await unfold(page, '#setup-speakers details.more');
}

/** Step names from the old wizard, kept so the journeys read the same: "Results" is the home page. */
export async function goStep(page: Page, name: string) {
  if (name === 'Results') return goHome(page);
  await openSection(page, name === 'Furnishing' ? 'Furniture' : name);
}

/** Set up keeps drivers, stands, exact sizes and the speaker file under "More about your speakers". */
export async function openSpeakerDetails(page: Page) {
  await openSettings(page);
  await unfold(page, '#setup-speakers details.more');
}

/** Back to the home page from a section. */
export async function showResults(page: Page) {
  await goHome(page);
}

/** The findings ("Why this result"): Place's details. */
export async function openWhy(page: Page) {
  await openTab(page, 'Why');
}

/** Metres from the front wall in a seat's accessible label, e.g. "Seat. 2.34 m from the front wall". */
export async function seatDistance(page: Page): Promise<number> {
  const label = await page
    .getByRole('button', { name: /^Seat\./ })
    .first()
    .getAttribute('aria-label');
  const match = /Seat\. ([\d.]+)\u00a0m from the front wall/.exec(label ?? '');
  if (!match) throw new Error(`Unexpected seat label: ${label}`);
  return Number(match[1]);
}

/** One of the map's two big choices ("Speakers" or "Seat"). */
export function mapChoice(page: Page, name: 'Speakers' | 'Seat') {
  return page
    .getByRole('radiogroup', { name: 'Map layer' })
    .getByRole('radio', { name, exact: true });
}

/** Opens Set up (every setting, in three groups). */
export async function openSettings(page: Page) {
  await openStep(page, 'setup');
}

/** What the answer may move: "Both", "Speakers" or "Seat" (on Place, with the map). */
export async function setMoves(page: Page, value: 'Both' | 'Speakers' | 'Seat') {
  await openStep(page, 'place');
  await page
    .getByRole('radiogroup', { name: 'Find the best place for' })
    .getByRole('radio', { name: value, exact: true })
    .check({ force: true });
}

/** A group of Set up (or the fold that holds an old section), so same-named fields stay apart. */
export function group(
  page: Page,
  name: 'room' | 'surfaces' | 'furnishing' | 'speakers' | 'goals' | 'place' | 'ready',
) {
  const at: Record<typeof name, string> = {
    room: '#setup-room',
    surfaces: '#setup-room-more',
    furnishing: '#setup-room-more',
    speakers: '#setup-speakers',
    goals: '#setup-listen-more',
    place: '#setup-listen',
    ready: '#setup-listen-more',
  };
  return page.locator(at[name]);
}
