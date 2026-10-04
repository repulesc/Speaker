import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { messageKeys, MESSAGES, translate } from '../../src/i18n/translate';
import { fillRoom, openMenu, savedProject } from './helpers';

// Metric by default, English UI.
test.use({ locale: 'en-GB' });

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Quick start/ }).click();
});

test('autosave: values survive a reload', async ({ page }) => {
  await fillRoom(page, '4', '5.2', '2.6');
  await savedProject(page);
  await page.reload();
  await expect(page.getByLabel('Width', { exact: true })).toHaveValue('4.00\u00a0m');
  await expect(page.getByLabel('Length', { exact: true })).toHaveValue('5.20\u00a0m');
});

test('journey 4 — units: switch to imperial, type feet and inches, stored in metres', async ({
  page,
}) => {
  await fillRoom(page, '4', '5', '2.5');
  await page.getByRole('radio', { name: 'ft' }).check({ force: true });
  await expect(page.getByLabel('Width', { exact: true })).toHaveValue('13′\u00a01½″');

  await page.getByLabel('Length', { exact: true }).fill(`11'6"`);
  await page.getByLabel('Length', { exact: true }).blur();
  await expect(page.getByLabel('Length', { exact: true })).toHaveValue('11′\u00a06″');

  const project = await savedProject(page);
  expect(project.room.length.value).toBeCloseTo(3.5052, 6);
  expect(project.units).toBe('imperial');
});

test('units: bad input is explained, out-of-range is rejected, unusual is allowed with a warning', async ({
  page,
}) => {
  const width = page.getByLabel('Width', { exact: true });
  await width.fill('banana');
  await width.blur();
  await expect(page.getByRole('alert')).toContainText('Not a length we understand');
  await width.fill('100');
  await width.blur();
  await expect(page.getByRole('alert')).toContainText('must be between');
  await width.fill('14');
  await width.blur();
  await expect(page.getByText('Is that right?')).toBeVisible();
  await expect(width).toHaveValue('14.00\u00a0m');
});

test('journey 5 — language: Hungarian shows no English UI text', async ({ page }) => {
  await page.getByRole('radio', { name: 'HU' }).check({ force: true });
  await expect(page.locator('html')).toHaveAttribute('lang', 'hu');
  await expect(page.getByRole('heading', { name: 'A helyiséged' })).toBeVisible();

  await page.getByRole('button', { name: 'Menü' }).click();
  const text = await page.locator('body').innerText();
  const leaks = messageKeys(MESSAGES.en)
    .map((key) => ({ key, en: translate('en', key), hu: translate('hu', key) }))
    .filter(({ en, hu }) => en !== hu && en.length >= 8 && !en.includes('{'))
    .filter(({ en }) => text.includes(en));
  expect(leaks.map((l) => l.key)).toEqual([]);

  // The choice is remembered.
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'hu');
});

test('journey 6 — share: a link opens an identical project for someone else', async ({
  page,
  browser,
}) => {
  await fillRoom(page, '4', '5.2', '2.6');
  await openMenu(page);
  await page.getByRole('button', { name: 'Share link' }).click();
  await expect(page.getByLabel('Share link')).toHaveValue(/#p=/); // the link is made a moment after the dialog opens
  const link = await page.getByLabel('Share link').inputValue();
  expect(link).toContain('#p=');
  await page.getByRole('button', { name: 'Close' }).click();

  const friend = await browser.newContext({ locale: 'en-GB' });
  const other = await friend.newPage();
  await other.goto(link);
  await expect(other.getByRole('status').filter({ hasText: 'Opened' })).toBeVisible();
  await expect(other.getByLabel('Width', { exact: true })).toHaveValue('4.00\u00a0m');
  await expect(other.getByLabel('Length', { exact: true })).toHaveValue('5.20\u00a0m');
  expect(other.url()).not.toContain('#p='); // the link is cleaned from the address bar
  await friend.close();
});

test('journey 7 — export and import round-trip; a corrupt file is rejected without harm', async ({
  page,
  browser,
}) => {
  await fillRoom(page, '4', '5.2', '2.6');
  await openMenu(page);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export file' }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('Untitled room.speaker.json');
  const path = await download.path();
  const exported = JSON.parse(readFileSync(path, 'utf8'));
  expect(exported.room.width.value).toBe(4);

  const fresh = await browser.newContext({ locale: 'en-GB' });
  const other = await fresh.newPage();
  await other.goto('/');
  await other.locator('input[type=file]').setInputFiles(path);
  await expect(other.getByLabel('Width', { exact: true })).toHaveValue('4.00\u00a0m');

  // In memory: Playwright ignores file paths that contain characters like the em dash in test-results.
  await other.locator('input[type=file]').setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{ "not": "a project" '),
  });
  await expect(other.getByRole('alert')).toContainText('not a readable project file');
  await expect(other.getByLabel('Width', { exact: true })).toHaveValue('4.00\u00a0m');
  await fresh.close();
});

test('journey 8 — blocked storage: the app works and says nothing is saved', async ({
  browser,
}) => {
  const context = await browser.newContext({ locale: 'en-GB' });
  await context.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('blocked', 'SecurityError');
      },
    });
  });
  const page = await context.newPage();
  await page.goto('/');
  await page.getByRole('button', { name: /Quick start/ }).click();
  await fillRoom(page, '4', '5', '2.5');
  await expect(page.getByLabel('Width', { exact: true })).toHaveValue('4.00\u00a0m');
  await expect(page.getByText('Not saved: your browser blocks storage')).toBeVisible();
  await context.close();
});

test('journey 10 — keyboard only: reach the first field, type, and move to the next step', async ({
  page,
}) => {
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    if (await page.evaluate(() => document.activeElement?.id === 'room-width')) break;
  }
  await expect(page.getByLabel('Width', { exact: true })).toBeFocused();
  await page.keyboard.type('4');
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Width', { exact: true })).toHaveValue('4.00\u00a0m');

  const next = page.getByRole('button', { name: 'Next' });
  await next.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Surfaces' })).toBeVisible();
});

test('undo and redo with the keyboard', async ({ page }) => {
  await fillRoom(page, '4', '5', '2.5');
  await page.locator('h2').first().click(); // leave the input so shortcuts act on the project
  await page.keyboard.press('Control+z');
  await expect(page.getByLabel('Ceiling height')).toHaveValue('');
  await page.keyboard.press('Control+Shift+z');
  await expect(page.getByLabel('Ceiling height')).toHaveValue('2.50\u00a0m');
});

test('confidence meter explains what would improve things', async ({ page }) => {
  await fillRoom(page, '4', '5', '2.5');
  await page.getByRole('button', { name: /How sure are we/ }).click();
  await expect(page.getByText('What would improve this?').first()).toBeVisible();
  await expect(page.getByText(/Tell us more about/)).toBeVisible();
});

test('projects: new, switch, rename and delete', async ({ page }) => {
  await fillRoom(page, '4', '5', '2.5');
  await page.getByRole('button', { name: /Current project/ }).click();
  await page.getByRole('button', { name: 'Rename', exact: true }).click();
  await page.getByLabel('Project name').fill('Living room');
  await page.getByRole('button', { name: 'Rename', exact: true }).click();
  await expect(page.getByRole('button', { name: /Current project: Living room/ })).toBeVisible();

  await page.getByRole('button', { name: /Current project/ }).click();
  await page.getByRole('button', { name: 'New project' }).click();
  await expect(page.getByLabel('Width', { exact: true })).toHaveValue('');

  await page.getByRole('button', { name: /Current project/ }).click();
  await page.getByRole('button', { name: 'Living room' }).click();
  await expect(page.getByLabel('Width', { exact: true })).toHaveValue('4.00\u00a0m');

  page.once('dialog', (d) => void d.accept());
  await page.getByRole('button', { name: /Current project/ }).click();
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByRole('button', { name: /Current project: Untitled room/ })).toBeVisible();
});
