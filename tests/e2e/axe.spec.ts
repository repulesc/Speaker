import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { fillRoom, goStep, openApp, openMenu, openSection, openWhy, openTab } from './helpers';

test.use({ locale: 'en-GB' });

/** Fails on any serious or critical violation (WCAG 2.2 AA rules, including colour contrast). */
async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual(
    [],
  );
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme} theme`, () => {
    test.use({ colorScheme: scheme });
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((theme) => localStorage.setItem('spa:theme', theme), scheme);
    });

    test('empty workbench (the first-run survey)', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('dialog').waitFor();
      await page.waitForTimeout(800); // the card fades in; scan the finished colours
      await expectAccessible(page);
    });

    test('filled room, menu and meter open', async ({ page }) => {
      await openApp(page);
      await fillRoom(page, '4', '5.2', '2.6');
      await page.getByLabel('Width', { exact: true }).fill('banana');
      await page.getByLabel('Width', { exact: true }).blur();
      await expectAccessible(page); // error message visible
      await openMenu(page);
      await expectAccessible(page);
    });
  });
}

test('Hungarian', async ({ page }) => {
  await openApp(page);
  await openMenu(page);
  await page.getByRole('radio', { name: 'HU' }).check({ force: true });
  await page.keyboard.press('Escape');
  await expectAccessible(page);
});

test('dialogs', async ({ page }) => {
  await openApp(page);
  await openMenu(page);
  await page.getByRole('button', { name: 'Share link' }).click();
  await expectAccessible(page);
});

const STEPS = ['Room', 'Speakers', 'Positions', 'Goals', 'Results'];

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`every section, ${scheme} theme`, () => {
    test.use({ colorScheme: scheme });
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((theme) => localStorage.setItem('spa:theme', theme), scheme);
    });

    test('with a filled room, every fold open', async ({ page }) => {
      test.setTimeout(90_000); // six full accessibility scans
      await openApp(page);
      await fillRoom(page, '4', '5', '2.5');

      for (const step of STEPS) {
        await goStep(page, step);
        await expectAccessible(page);
      }
      await goStep(page, 'Goals');
      await page.getByRole('button', { name: 'Wide soundstage' }).click();
      await page.getByRole('button', { name: 'Precise imaging' }).click();
      await expectAccessible(page); // conflict notice visible
    });
  });
}

test('Place, its details, Listen with experiments, and the bass-note explorer', async ({
  page,
}) => {
  await openApp(page);
  await fillRoom(page, '4', '5', '2.5');
  await goStep(page, 'Results');
  await expectAccessible(page); // Place: the best placement
  await openWhy(page);
  await expectAccessible(page);
  await openSection(page, 'Improve the room');
  await expectAccessible(page);
  await openSection(page, 'Listening check');
  const bass = page.getByRole('group', { name: 'Bass', exact: true });
  await bass.getByRole('button', { name: 'Boomy' }).click();
  await page.getByTestId('experiment').first().waitFor();
  await expectAccessible(page); // answers and the experiments
  const tryIt = page.getByTestId('experiment').getByRole('button', { name: 'Try it' }).first();
  if (await tryIt.count()) {
    await tryIt.click();
    await expectAccessible(page); // "How was it?"
  }
  await openTab(page, 'Why');
  await page.getByRole('button', { name: 'Bass note' }).click();
  await expectAccessible(page);
});
