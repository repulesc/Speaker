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

/** The sidebar's home: the result tabs (closes the "Your room" sheet or a page). */
export async function goHome(page: Page) {
  const done = page.locator('#panel').getByRole('button', { name: 'Done', exact: true });
  if (await done.count()) await done.first().click();
  const back = page.getByRole('button', { name: 'Back', exact: true });
  if (await back.count()) await back.click();
}

/** One of the result tabs (docs/ROADMAP_V5.md, V6). */
export async function openTab(page: Page, name: 'Result' | 'Why' | 'Tips') {
  await goHome(page);
  await page.getByRole('tab', { name, exact: true }).click();
}

/** Where a name from the old home list lives now: a group of the sheet, a tab, or the menu. */
const TABS: Record<string, 'Why' | 'Tips'> = {
  'Why this result': 'Why',
  'Bass at your seat': 'Why',
  'Improve the room': 'Tips',
};

/** Opens a section: a group of the "Your room" sheet, a result tab, or Listening notes. */
export async function openSection(page: Page, name: string) {
  if (TABS[name]) return openTab(page, TABS[name]);
  if (name === 'Listening notes') {
    await goHome(page);
    await openMenu(page);
    await page.getByRole('button', { name: 'Listening notes' }).click();
    return;
  }
  await openSettings(page);
  const heading = SECTION_TITLES[name];
  if (heading)
    await page
      .getByRole('heading', { name: heading, exact: true, level: 2 })
      .scrollIntoViewIfNeeded();
}

const SECTION_TITLES: Record<string, string> = {
  Room: 'Room size',
  Surfaces: 'Surfaces',
  Furniture: 'Furniture',
  Speakers: 'Speakers',
  Goals: 'What do you want from the sound?',
};

/** Step names from the old wizard, kept so the journeys read the same: "Results" is the home page. */
export async function goStep(page: Page, name: string) {
  if (name === 'Results') return goHome(page);
  await openSection(page, name === 'Furnishing' ? 'Furniture' : name);
}

/** The Speakers page keeps size, port, seat, toe-in and the speaker file under "More details". */
export async function openSpeakerDetails(page: Page) {
  const more = page.locator('#sheet-speakers details.more');
  if (!(await more.evaluate((d) => (d as HTMLDetailsElement).open))) {
    await more.locator('summary').click();
  }
}

/** Back to the home page from a section. */
export async function showResults(page: Page) {
  await goHome(page);
}

/** The findings page ("Why this result"). */
export async function openWhy(page: Page) {
  await openSection(page, 'Why this result');
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

/** Opens the "Your room" sheet (every setting on one page). */
export async function openSettings(page: Page) {
  if (
    await page
      .locator('#panel')
      .getByRole('heading', { name: /^(Your room|A szobád)$/, level: 2 })
      .count()
  )
    return;
  await goHome(page);
  await page.getByRole('button', { name: /^(Your room|A szobád)/ }).click();
}

/** What the answer may move: "Both", "Speakers" or "Seat" (on the Result tab, with the map). */
export async function setMoves(page: Page, value: 'Both' | 'Speakers' | 'Seat') {
  await openTab(page, 'Result');
  await page
    .getByRole('radiogroup', { name: 'Find the best place for' })
    .getByRole('radio', { name: value, exact: true })
    .check({ force: true });
}

/** One group of the "Your room" sheet, so fields with the same name in other groups stay apart. */
export function group(
  page: Page,
  name: 'room' | 'surfaces' | 'furnishing' | 'speakers' | 'goals' | 'place' | 'ready',
) {
  return page.locator(`#sheet-${name}`);
}
