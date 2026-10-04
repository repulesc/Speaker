import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { fillRoom, goStep } from './helpers';

test.use({ locale: 'en-GB' });

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await fillRoom(page, '4', '5.2', '2.6');
});

test('journey 9 — phone: no horizontal scroll, the bottom sheet works', async ({ page }) => {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);

  const plan = page.getByRole('region', { name: 'Top view of the room' });
  const before = (await plan.boundingBox())!.height;
  await page.getByRole('button', { name: 'Show more' }).click(); // half → full
  await expect.poll(async () => (await plan.boundingBox())!.height).toBeLessThan(before);
  await page.getByRole('button', { name: 'Show less' }).click(); // full → peek
  await expect.poll(async () => (await plan.boundingBox())!.height).toBeGreaterThan(before);
});

/** Controls smaller than 44 × 44 px on screen right now. */
async function smallControls(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const controls = document.querySelectorAll(
      'button, input:not([type=radio]):not([type=checkbox]), label:has(input[type=radio]), summary, a[href]',
    );
    return [...controls]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return r.width > 1 && r.height > 1 && style.visibility !== 'hidden';
      })
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width < 43.5 || r.height < 43.5;
      })
      .map(
        (el) =>
          `${el.tagName.toLowerCase()} ${el.getAttribute('aria-label') ?? el.textContent?.trim().slice(0, 20)} ${Math.round(el.getBoundingClientRect().width)}×${Math.round(el.getBoundingClientRect().height)}`,
      );
  });
}

test('phone: every visible control is at least 44 × 44 px', async ({ page }) => {
  expect(await smallControls(page)).toEqual([]);
});

test('phone: the Treat and Listen tabs and the bass-note bar keep 44 px targets (R5)', async ({
  page,
}) => {
  await goStep(page, 'Results');
  for (const tab of ['Treat', 'Listen']) {
    await page.getByRole('tab', { name: tab }).click();
    expect(await smallControls(page), tab).toEqual([]);
  }
  await page.getByRole('tab', { name: 'Why' }).click();
  await page.getByRole('button', { name: 'Bass note' }).click();
  expect(await smallControls(page), 'bass note').toEqual([]);
});

test('phone: one drawing at a time, switchable between top and side view', async ({ page }) => {
  const top = page.getByRole('region', { name: 'Top view of the room' });
  const side = page.getByRole('region', { name: 'Side view of the room' });
  await expect(top).toBeVisible();
  await expect(side).toHaveCount(0);
  await page.getByRole('button', { name: 'Side view' }).click();
  await expect(side).toBeVisible();
  await expect(top).toHaveCount(0);
  await page.getByRole('button', { name: 'Side view' }).click();
  await expect(top).toBeVisible();
});

test('phone: every section fits the screen without sideways scrolling', async ({ page }) => {
  for (const step of ['Surfaces', 'Furnishing', 'Speakers', 'Goals', 'Results', 'Listen']) {
    if (step === 'Listen') {
      await page.getByRole('tab', { name: 'Listen' }).click();
    } else await goStep(page, step);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, step).toBeLessThanOrEqual(0);
    const panelOverflow = await page.evaluate(() => {
      const panel = document.getElementById('panel')!;
      return panel.scrollWidth - panel.clientWidth;
    });
    expect(panelOverflow, `${step} panel`).toBeLessThanOrEqual(0);
  }
});

test('phone: language and units live in the menu', async ({ page }) => {
  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(page.getByRole('radio', { name: 'HU' })).toBeAttached();
  await expect(page.getByRole('radio', { name: 'ft' })).toBeAttached();
});

test('phone: accessible', async ({ page }) => {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .analyze();
  expect(
    results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'),
  ).toEqual([]);
});
