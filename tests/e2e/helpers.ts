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

/** The sidebar's home page: the best placement and the list of everything. */
export async function goHome(page: Page) {
  const back = page.getByRole('button', { name: 'Back', exact: true });
  if (await back.count()) await back.click();
}

/** Opens a row of the sidebar's home list (Room, Surfaces, Furniture, …, Why this result). */
export async function openSection(page: Page, name: string) {
  const heading = SECTION_TITLES[name];
  if (
    heading &&
    (await page.getByRole('heading', { name: heading, exact: true, level: 2 }).count())
  )
    return;
  await goHome(page);
  await page
    .locator('#panel .list')
    .getByRole('button', { name: new RegExp(`^${name}(\\s|$)`) })
    .click();
}

const SECTION_TITLES: Record<string, string> = {
  Room: 'Your room',
  Surfaces: 'Surfaces',
  Furniture: 'Furniture',
  Speakers: 'Speakers',
  Goals: 'What matters to you',
};

/** Step names from the old wizard, kept so the journeys read the same: "Results" is the home page. */
export async function goStep(page: Page, name: string) {
  if (name === 'Results') return goHome(page);
  await openSection(page, name === 'Furnishing' ? 'Furniture' : name);
}

/** The Speakers page keeps size, port, seat, toe-in and the speaker file under "More details". */
export async function openSpeakerDetails(page: Page) {
  const more = page.locator('details.more');
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
