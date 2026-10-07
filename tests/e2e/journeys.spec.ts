import { expect, test } from '@playwright/test';
import { encodeShare } from '../../src/app/state/share';
import { messageKeys, MESSAGES, translate } from '../../src/i18n/translate';
import { makeProject } from '../fixtures/projects';
import {
  describeSpeakers,
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
  await page.getByRole('radio', { name: /^Imperial/ }).check({ force: true });
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
  await page.getByRole('radio', { name: 'Magyar' }).check({ force: true });
  await page.keyboard.press('Escape');
  await expect(page.locator('html')).toHaveAttribute('lang', 'hu');
  await expect(page.getByRole('heading', { name: 'Szoba', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Menü', exact: true }).click();
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
  await expect(page.getByRole('button', { name: 'Menu', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
  await context.close();
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

  const done = page.getByRole('button', { name: 'See where they go' });
  await done.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Your result' })).toBeVisible();
});

test('undo and redo with the keyboard', async ({ page }) => {
  await fillRoom(page, '4', '5', '2.5');
  await page.locator('#panel .mast').click(); // leave the input so shortcuts act on the project
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

test('the room: no name until you give one in the menu, start over with an empty one', async ({
  page,
}) => {
  const header = page.locator('#panel .mast');
  await fillRoom(page, '4', '5', '2.5');
  // V10: the header holds no size and no "Untitled room"; a name shows only once given.
  await expect(header).not.toContainText('Untitled room');
  await expect(header).not.toContainText('×');
  await openMenu(page);
  const drawer = page.getByRole('dialog', { name: 'Menu' });
  await drawer.getByLabel('Name').fill('Living room');
  await drawer.getByLabel('Name').press('Enter');
  await drawer.getByRole('button', { name: 'Close the menu' }).click();
  await expect(drawer).toBeHidden();
  await expect(header).toContainText('Living room');

  // One room (V9): no project list; starting over replaces it after asking.
  page.once('dialog', (d) => void d.accept());
  await openMenu(page);
  await expect(page.getByText('Rooms on this device')).toHaveCount(0);
  await page.getByRole('button', { name: 'Start over' }).click();
  await expect(
    page
      .getByRole('dialog', { name: 'How big is your room?' })
      .or(page.getByRole('dialog', { name: /Where should your speakers go/ })),
  ).toBeVisible(); // the first-run survey again
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(page.getByLabel('Width', { exact: true })).toHaveValue('');
  await page.getByRole('button', { name: 'Skip' }).click();
  await expect(header).not.toContainText('Living room');
});

test('first run: three questions, no tape measure, then a first guess to drag', async ({
  page,
}) => {
  await page.goto('/');
  const survey = page.getByRole('dialog');
  // The welcome says what this is, that it is free, and lets you pick the language.
  await expect(survey).toContainText('Where should your speakers go?');
  await expect(survey).toContainText('Free, with no sign-up and no email');
  await survey.getByRole('radio', { name: 'HU' }).check({ force: true });
  await expect(survey).toContainText('Ingyenes');
  await survey.getByRole('radio', { name: 'EN' }).check({ force: true });
  await survey.getByRole('button', { name: 'Start' }).click();
  await expect(survey).toContainText('1 of 3');
  await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled(); // a room size first
  await fillRoom(page, '4.2', '5.5', '2.6', 'Where to put my speakers');
  // fillRoom skips after the goal; start again to walk all four screens.
  page.once('dialog', (d) => void d.accept());
  await openMenu(page);
  await page.getByRole('button', { name: 'Start over' }).click();
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByLabel('Width', { exact: true }).fill('4.2');
  await page.getByLabel('Length', { exact: true }).fill('5.5');
  await page.getByLabel('Length', { exact: true }).blur();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('radio', { name: /^Where to put my speakers/ }).check({ force: true });
  await page.getByRole('button', { name: 'Next' }).click();
  // The list first; without your model, three dropdowns, each starting at "Not sure".
  await describeSpeakers(page);
  await expect(page.getByLabel('How big?')).toHaveValue('');
  await page.getByLabel('What kind of speakers?').selectOption('monitor');
  await page.getByLabel('How big?').selectOption('large');
  await page.getByLabel('Bass port').selectOption('sealed');
  await expect(page.getByLabel('What kind of speakers?')).toHaveValue('monitor');
  await page.getByRole('button', { name: 'Show me' }).click();
  await expect(survey).toHaveCount(0);
  // No distances asked: a first guess (seat at 38 % of the length), said on the map.
  const guess = page.getByTestId('first-guess');
  await expect(guess).toContainText('first suggestion');

  const project = await savedProject(page);
  expect(project.constraints.listenerFixed).toBe(true);
  expect(project.constraints.speakersFixed).toBe(false);
  expect(project.variants[0].listener.ears.y).toBeCloseTo(0.38 * 5.5, 6);
  expect(project.variants[0].listener.certainty).toBe('unknown');
  expect(project.speaker.choices).toEqual({ kind: 'monitor', size: 'large', port: 'sealed' });
  expect(project.speaker.enclosure.value).toBe('sealed');
  expect(project.speaker.dimensions.h).toEqual({ value: 0.4, certainty: 'estimated' });
  await expect(page.getByTestId('suggestion')).toContainText('Stays where it is');
  await expect(mapChoice(page, 'Speakers')).toBeChecked(); // the map follows the goal
  // "Looks right" makes the guess the user's own placement; the note goes.
  await guess.getByRole('button', { name: 'Looks right' }).click();
  await expect(guess).toHaveCount(0);
  const placed = await savedProject(page);
  expect(placed.variants[0].listener.certainty).toBe('estimated');
  expect(placed.variants[0].speakers.left.certainty).toBe('estimated');
});

test('the menu is a drawer over the panel: preferences, sharing, about', async ({ page }) => {
  await fillRoom(page, '4', '5', '2.5');
  await openMenu(page);
  const drawer = page.locator('#menu-drawer');
  await expect(drawer).toBeVisible();
  const panel = (await page.locator('#panel').boundingBox())!;
  await expect.poll(async () => (await drawer.boundingBox())!.x).toBe(0); // after the slide-in
  expect(Math.abs((await drawer.boundingBox())!.width - panel.width)).toBeLessThan(2);
  await drawer.getByRole('radio', { name: 'Magyar' }).check({ force: true });
  await expect(drawer).toContainText('Beállítások');
  await drawer.getByRole('radio', { name: 'English' }).check({ force: true });
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(page.getByRole('button', { name: 'Menu', exact: true })).toBeFocused();
  await openMenu(page);
  await drawer.getByRole('button', { name: 'About and sources' }).click();
  const about = page.getByRole('dialog', { name: 'About Nodo' });
  await expect(about).toBeVisible();
  await expect(about).toContainText('What needs your ears');
  await expect(about.getByRole('link')).toHaveCount(0); // no support link, no "new tab"
  await about.getByRole('button', { name: 'Close' }).click();
  await expect(about).toBeHidden();
});

test('the support link stays in view under the map and opens in a new tab', async ({ page }) => {
  const link = page.getByRole('link', { name: /Support NODO/ });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', /noopener/);
});
