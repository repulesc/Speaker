import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { fillRoom, goStep, openMenu } from './helpers';

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

    test('empty workbench', async ({ page }) => {
      await page.goto('/');
      await expectAccessible(page);
    });

    test('filled room, menu and meter open', async ({ page }) => {
      await page.goto('/');
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
  await page.goto('/');
  await page.getByRole('radio', { name: 'HU' }).check({ force: true });
  await expectAccessible(page);
});

test('dialogs', async ({ page }) => {
  await page.goto('/');
  await openMenu(page);
  await page.getByRole('button', { name: 'Share link' }).click();
  await expectAccessible(page);
});

const STEPS = ['Room', 'Surfaces', 'Furnishing', 'Speakers', 'Goals', 'Results'];

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`every section, ${scheme} theme`, () => {
    test.use({ colorScheme: scheme });
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((theme) => localStorage.setItem('spa:theme', theme), scheme);
    });

    test('with a filled room, a patch, an object and a second setup', async ({ page }) => {
      test.setTimeout(90_000); // seven full accessibility scans
      await page.goto('/');
      await fillRoom(page, '4', '5', '2.5');

      // Give the later steps something to show: a patch, an object, a second setup.
      await goStep(page, 'Surfaces');
      await page.getByRole('radio', { name: /^Left wall/ }).check();
      await page.getByRole('button', { name: '+ Shelf or CD wall' }).click();
      await goStep(page, 'Furnishing');
      await page.getByRole('button', { name: '+ Bed' }).click();
      await page.getByRole('button', { name: '+ New setup' }).click();

      for (const step of STEPS) {
        await goStep(page, step);
        await expectAccessible(page);
      }
      await goStep(page, 'Goals');
      await page
        .getByRole('radiogroup', { name: 'Wide soundstage' })
        .getByRole('radio', { name: 'Important' })
        .check();
      await page
        .getByRole('radiogroup', { name: 'Precise imaging' })
        .getByRole('radio', { name: 'Important' })
        .check();
      await expectAccessible(page); // conflict notice visible
    });
  });
}

test('Treat tab and bass-note explorer', async ({ page }) => {
  await page.goto('/');
  await fillRoom(page, '4', '5', '2.5');
  await goStep(page, 'Results');
  await page.getByRole('tab', { name: 'Treat' }).click();
  await expectAccessible(page);
  await page.getByRole('tab', { name: 'Why' }).click();
  await page.getByRole('button', { name: 'Bass note' }).click();
  await expectAccessible(page);
});
