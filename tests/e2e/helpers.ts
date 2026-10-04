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
