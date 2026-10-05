import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { encodeShare } from '../../src/app/state/share';
import { messageKeys, MESSAGES, translate } from '../../src/i18n/translate';
import { makeProject } from '../fixtures/projects';
import {
  fillRoom,
  goHome,
  mapChoice,
  openApp,
  openMenu,
  openSection,
  savedProject,
} from './helpers';

// Metric by default, English UI.
test.use({ locale: 'en-GB' });

test.beforeEach(async ({ page }) => {
  await openApp(page);
});

test('autosave: values survive a reload', async ({ page }) => {
  await fillRoom(page, '4', '5.2', '2.6');
  await savedProject(page);
  await page.reload();
  await openSection(page, 'Room'); // a project with a room opens on the results
  await expect(page.getByLabel('Width', { exact: true })).toHaveValue('4.00\u00a0m');
  await expect(page.getByLabel('Length', { exact: true })).toHaveValue('5.20\u00a0m');
});

test('journey 4 — units: switch to imperial, type feet and inches, stored in metres', async ({
  page,
}) => {
  await fillRoom(page, '4', '5', '2.5');
  await openMenu(page);
  await page.getByRole('radio', { name: 'ft' }).check({ force: true });
  await page.keyboard.press('Escape');
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
  await openMenu(page);
  await page.getByRole('radio', { name: 'HU' }).check({ force: true });
  await page.keyboard.press('Escape');
  await expect(page.locator('html')).toHaveAttribute('lang', 'hu');
  await expect(page.getByRole('heading', { name: 'A szoba mérete' })).toBeVisible();

  await page.getByRole('button', { name: 'Beállítások' }).click();
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
  await openSection(other, 'Room'); // an opened project shows its results first
  await expect(other.getByLabel('Width', { exact: true })).toHaveValue('4.00\u00a0m');
  await expect(other.getByLabel('Length', { exact: true })).toHaveValue('5.20\u00a0m');
  expect(other.url()).not.toContain('#p='); // the link is cleaned from the address bar
  await friend.close();
});

test('a crafted share link is refused, and the app still works after a reload', async ({
  browser,
}) => {
  // Two setups with one id used to break the page for good (R0 audit, finding C3).
  const project = makeProject();
  project.variants.push({ ...structuredClone(project.variants[0]!), name: 'Copy' });
  const context = await browser.newContext({ locale: 'en-GB' });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/' + (await encodeShare(project)));
  await expect(page.getByRole('alert')).toContainText('could not be read');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible();
  expect(errors).toEqual([]);
  await context.close();
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
  await openSection(other, 'Room'); // an opened project shows its results first
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
  await openApp(page);
  await fillRoom(page, '4', '5', '2.5');
  await expect(page.getByLabel('Width', { exact: true })).toHaveValue('4.00\u00a0m');
  await expect(page.getByText('Not saved: your browser blocks storage')).toBeVisible();
  await context.close();
});

test('journey 10 — keyboard only: skip to the panel, type, and open the results', async ({
  page,
}) => {
  await page.keyboard.press('Tab'); // the skip link comes first
  await page.keyboard.press('Enter');
  for (let i = 0; i < 30; i++) {
    if (await page.evaluate(() => document.activeElement?.id === 'room-width')) break;
    await page.keyboard.press('Tab');
  }
  const width = page.locator('#room-width');
  await expect(width).toBeFocused();
  await page.keyboard.type('4');
  await page.keyboard.press('Enter');
  await expect(width).toHaveValue('4.00\u00a0m');

  const done = page.getByRole('button', { name: 'Done' }).first();
  await done.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Your result' })).toBeVisible();
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
  await goHome(page);
  await page.getByRole('button', { name: /How sure are we/ }).click();
  await expect(page.getByText('What would improve this?').first()).toBeVisible();
  await expect(page.getByText(/Tell us more about/)).toBeVisible();
});

test('projects: new, switch, rename and delete', async ({ page }) => {
  const header = page.locator('#panel header');
  await fillRoom(page, '4', '5', '2.5');
  await openMenu(page);
  await page.getByRole('button', { name: 'Rename', exact: true }).click();
  await page.getByLabel('Project name').fill('Living room');
  await page.getByLabel('Project name').press('Enter');
  await expect(header).toContainText('Living room');
  await page.keyboard.press('Escape');

  await openMenu(page);
  await page.getByRole('button', { name: 'New project' }).click();
  // A new project starts with the survey.
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(page.getByLabel('Width', { exact: true })).toHaveValue('');
  await page.getByRole('button', { name: 'Skip' }).click();

  await openMenu(page);
  await page.getByRole('button', { name: 'Living room' }).click();
  await openSection(page, 'Room');
  await expect(page.getByLabel('Width', { exact: true })).toHaveValue('4.00\u00a0m');

  page.once('dialog', (d) => void d.accept());
  await openMenu(page);
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(header).toContainText('Untitled room');
});

test('first run: the survey asks four questions, then shows the answer', async ({ page }) => {
  await page.goto('/');
  const survey = page.getByRole('dialog');
  // The welcome says what this is, that it is free, and lets you pick the language.
  await expect(survey).toContainText('Where should your speakers go?');
  await expect(survey).toContainText('Free, with no sign-up and no email');
  await survey.getByRole('radio', { name: 'HU' }).check({ force: true });
  await expect(survey).toContainText('Ingyenes');
  await survey.getByRole('radio', { name: 'EN' }).check({ force: true });
  await survey.getByRole('button', { name: 'Start' }).click();
  await expect(survey).toContainText('1 of 4');
  await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled(); // a room size first
  await fillRoom(page, '4.2', '5.5', '2.6', 'Where to put my speakers');
  // fillRoom skips after the goal; start again to walk all four screens.
  await openMenu(page);
  await page.getByRole('button', { name: 'New project' }).click();
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByLabel('Width', { exact: true }).fill('4.2');
  await page.getByLabel('Length', { exact: true }).fill('5.5');
  await page.getByLabel('Length', { exact: true }).blur();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('radio', { name: /^Where to put my speakers/ }).check({ force: true });
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('radio', { name: /Coaxial active monitor/ }).check({ force: true });
  // The port and, folded away, how widely they spread sound.
  await page.getByRole('radio', { name: 'None (sealed)' }).check({ force: true });
  await page.getByText('More (optional)').click();
  await page.getByRole('radio', { name: 'Wide', exact: true }).check({ force: true });
  await expect(page.getByRole('radio', { name: /Coaxial active monitor/ })).toBeChecked();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByLabel('Seat to the front wall').fill('3.2');
  await page.getByLabel('Distance between the speakers').fill('1.8');
  await page.getByLabel('Distance between the speakers').blur();
  await page.getByRole('button', { name: 'Show me' }).click();
  await expect(survey).toHaveCount(0);

  const project = await savedProject(page);
  expect(project.constraints.listenerFixed).toBe(true);
  expect(project.constraints.speakersFixed).toBe(false);
  expect(project.variants[0].listener.ears.y).toBeCloseTo(3.2, 6);
  expect(project.speaker.driverLayout.value).toBe('coaxial');
  expect(project.speaker.enclosure.value).toBe('sealed');
  expect(project.speaker.directivity.qMid.value).toBe(1);
  await expect(page.getByTestId('suggestion')).toContainText('Stays where it is');
  await expect(mapChoice(page, 'Speakers')).toBeChecked(); // the map follows the goal
});
