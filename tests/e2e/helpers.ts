import type { Page } from '@playwright/test';

/** Fills the three room fields (English labels) and moves focus away so the values commit. */
export async function fillRoom(page: Page, width: string, length: string, height: string) {
  await page.getByLabel('Width', { exact: true }).fill(width);
  await page.getByLabel('Length', { exact: true }).fill(length);
  await page.getByLabel('Ceiling height').fill(height);
  await page.getByLabel('Ceiling height').blur();
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
  await page.getByRole('button', { name: 'Menu' }).click();
}

/** Opens a step from the stepper (matches names like "Surfaces optional" in Quick mode too). */
export async function goStep(page: Page, name: string) {
  await page
    .getByRole('navigation', { name: 'Steps' })
    .getByRole('button', { name: new RegExp(`^${name}`) })
    .click();
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
