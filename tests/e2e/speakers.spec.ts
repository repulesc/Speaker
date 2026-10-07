import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { fillRoom, openApp, openSettings, openSpeakerDetails, savedProject } from './helpers';

/**
 * "Find your speaker" (docs/SPEAKER_DATA.md), on the invented entries of the e2e build
 * (tests/fixtures/speakers): search first, browse by brand, a compact card once picked, and
 * "Describe it instead" for anything not listed.
 */
test.use({ locale: 'en-GB' });

async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual(
    [],
  );
}

const finder = (page: Page) => page.getByRole('combobox', { name: 'Find your speaker' });
const options = (page: Page) => page.locator('ul[role="listbox"]').getByRole('option');

test('the survey asks for the model first: browse a brand, forgive the spelling, pick', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByLabel('Width', { exact: true }).fill('4');
  await page.getByLabel('Length', { exact: true }).fill('5');
  await page.getByLabel('Length', { exact: true }).blur();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();

  // Empty: the brands to browse. A brand lists its models.
  await expect(finder(page)).toBeVisible();
  await expect(page.getByText('Or browse by brand')).toBeVisible();
  await expect(options(page)).toHaveText([/^Example Audio/, /^Sample Labs/]);
  await options(page).filter({ hasText: 'Example Audio' }).click();
  await expect(finder(page)).toHaveValue('Example Audio ');
  await expect(options(page)).toHaveCount(4);

  // Forgiving: a generation however it is written, the arrow keys and Enter.
  await finder(page).fill('shelf one mk2');
  await expect(options(page).first()).toContainText('Shelf One Mk II');
  await finder(page).press('ArrowDown');
  await expect(options(page).first()).toHaveAttribute('aria-selected', 'true');
  await finder(page).press('Enter');

  const card = page.locator('.speaker-card');
  await expect(card.getByRole('heading')).toHaveText(/Example Audio\s+Shelf One Mk II/);
  await expect(card).toContainText('Bookshelf · sealed · −6 dB at 55 Hz');
  await expect(card.getByRole('link')).toHaveText('From the maker’s page, read on 1 Oct 2026');
  await expect(card.getByRole('link')).toHaveAttribute(
    'href',
    'https://example.com/example-audio/shelf-one-mk-ii',
  );

  await page.getByRole('button', { name: 'Show me' }).click();
  const project = await savedProject(page);
  expect(project.speaker.listed.id).toBe('example-audio-shelf-one-mk-ii');
  expect(project.speaker.dimensions.d).toEqual({ value: 0.26, certainty: 'measured' });
  expect(project.speaker.portLocation).toEqual({ value: 'none', certainty: 'measured' });
});

test('Room & speakers: a typo still finds it; the card, the place, details, change, describe', async ({
  page,
}) => {
  await openApp(page);
  await fillRoom(page, '4', '5', '2.5');
  await openSettings(page);

  await finder(page).fill('mini wirless');
  await expect(options(page)).toHaveCount(1);
  await expectAccessible(page);
  await options(page).click();

  const card = page.locator('.speaker-card');
  // The port was seen on the maker's photos: the card says so, quietly.
  await expect(card).toContainText(
    'Port position from the maker’s photos. Check the back of yours.',
  );
  // A bass figure with no stated level is an estimate.
  await expect(card).toContainText('Bookshelf · rear port · −6 dB at about 50 Hz');
  await expect(page.getByLabel('They stand on')).toBeVisible();
  await expect(page.getByLabel('What kind of speakers?')).toHaveCount(0);
  await expectAccessible(page);

  // Changed by hand: the card says so.
  await openSpeakerDetails(page);
  await expect(page.locator('#setup-speakers .fold-title')).toHaveText('Edit details');
  await page.locator('#speaker-w').fill('17');
  await page.locator('#speaker-w').blur();
  await expect(card).toContainText('Changed by you.');

  // Change, then keep it after all.
  await card.getByRole('button', { name: 'Change' }).click();
  await expect(finder(page)).toBeFocused();
  await page.getByRole('button', { name: 'Keep Mini Wireless' }).click();
  await expect(card).toBeVisible();

  // Not listed: the questions come back, from the kind that was picked.
  await card.getByRole('button', { name: 'Change' }).click();
  await page.getByRole('button', { name: /^Not listed\? Describe it instead/ }).click();
  await expect(page.getByLabel('What kind of speakers?')).toHaveValue('bookshelf');
  await expect(page.getByRole('button', { name: /^Find it in the list instead/ })).toBeVisible();
  const project = await savedProject(page);
  expect(project.speaker.listed).toBeUndefined();
  expect(project.speaker.brand).toBe('');
});

test('a design the room model does not describe well says so', async ({ page }) => {
  await openApp(page);
  await fillRoom(page, '4', '5', '2.5');
  await openSettings(page);
  await finder(page).fill('panel 7');
  await finder(page).press('Enter');
  await expect(page.locator('.speaker-card')).toContainText('A panel speaker plays backwards too');
  // No bass figure from the maker: the line leaves it out rather than guess.
  await expect(page.locator('.speaker-card')).toContainText('Floor-standing · open baffle');
  await expect(page.locator('.speaker-card')).not.toContainText('Hz');
});
