import { expect, test, type Page } from '@playwright/test';
import { fillRoom, goStep, savedProject } from './helpers';

test.use({ locale: 'en-GB' });

/** A room with the default speakers, open on the results ("Why"). */
async function withResults(page: Page) {
  await page.goto('/');
  await fillRoom(page, '4', '5', '2.5');
  await goStep(page, 'Results');
  await expect(page.getByTestId('score-best')).toBeVisible();
}

test('the map shows a heatmap, layers that say what they mean, and a legend', async ({ page }) => {
  await withResults(page);
  await expect(page.locator('canvas.heat')).toBeVisible();
  const layers = page.getByRole('radiogroup', { name: 'Map layer' }).getByRole('radio');
  await expect(layers).toHaveCount(8);
  await page.getByRole('radio', { name: 'Bass holes' }).check({ force: true });
  await expect(page.getByText('Whether a bass note nearly vanishes here')).toBeVisible();
  await expect(page.getByText('Physics', { exact: false }).first()).toBeVisible();
  await expect(page.getByText('Poorer')).toBeVisible();
});

test('the side view stays hidden until asked for', async ({ page }) => {
  await withResults(page);
  const side = page.getByRole('region', { name: 'Side view of the room' });
  await expect(side).toHaveCount(0);
  await page.getByRole('button', { name: 'Side view' }).click();
  await expect(side).toBeVisible();
  await page.getByRole('button', { name: 'Side view' }).click();
  await expect(side).toHaveCount(0);
});

test('the findings are readable sentences, grouped, with their evidence level', async ({
  page,
}) => {
  await withResults(page);
  const counts = page.getByTestId('finding-counts');
  await expect(counts).toHaveText(/Red flags: \d+ · Cautions: \d+/);
  const first = page.locator('article').first();
  await expect(first).toContainText(/Red flag|Caution/);
  await expect(first).toContainText(/Physics|Guideline|Rule of thumb/);
  const body = await page.locator('body').innerText();
  expect(body).not.toMatch(/finding\.[A-Z]\d\d|advice\.[A-Z]\d\d|\{\w+\}/);
});

test('best spots: preview on the map, try one, undo brings the setup back', async ({ page }) => {
  await withResults(page);
  const before = (await savedProject(page)).variants[0].listener.ears.y;
  await page.getByRole('button', { name: /^Spot A/ }).click();
  await expect(page.getByText('Showing spot A on the map and in the chart.')).toBeVisible();
  await expect(page.getByText(/speakers .* from the front wall and .* apart/i)).toBeVisible();

  await page.getByRole('button', { name: 'Try spot A' }).last().click();
  await expect(page.getByRole('status').filter({ hasText: 'Spot A applied' })).toBeVisible();
  const moved = (await savedProject(page)).variants[0];
  expect(moved.listener.ears.y).not.toBeCloseTo(before, 2);
  expect(moved.speakers.left.certainty).toBe('estimated');

  await page.locator('h2').first().click();
  await page.keyboard.press('Control+z');
  await expect
    .poll(async () => (await savedProject(page)).variants[0].listener.ears.y)
    .toBeCloseTo(before, 2);
});

test('the probe: click the map to see why, then move the seat there', async ({ page }) => {
  await withResults(page);
  const plan = page.getByRole('group', { name: 'Top view of the room' });
  const box = (await plan.boundingBox())!;
  const before = (await savedProject(page)).variants[0].listener.ears;
  // A point in the lower half of the room, clear of the pins and the dimension labels.
  await page.mouse.click(box.x + box.width * 0.4, box.y + box.height * 0.62);
  const card = page.getByRole('region', { name: /^Seat here/ });
  await expect(card).toBeVisible();
  await expect(card).toContainText(/Score:/);
  await card.getByRole('button', { name: 'Move my seat here' }).click();
  await expect(card).toHaveCount(0);
  const after = (await savedProject(page)).variants[0].listener;
  expect(after.ears.y).not.toBeCloseTo(before.y, 1);
  expect(after.certainty).toBe('estimated');
});

test('click a number on the map to type an exact value', async ({ page }) => {
  await withResults(page);
  await page.getByRole('button', { name: /^Seat to front wall/ }).click();
  const input = page.getByRole('textbox', { name: /Type an exact value for Seat to front wall/ });
  await input.fill('2.6');
  await input.press('Enter');
  await expect
    .poll(async () => (await savedProject(page)).variants[0].listener.ears.y)
    .toBeCloseTo(2.6, 6);

  // A value that cannot be right is explained, not applied.
  await page.getByRole('button', { name: /^Seat to front wall/ }).click();
  await page
    .getByRole('textbox', { name: /Type an exact value for Seat to front wall/ })
    .fill('banana');
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('alert').filter({ hasText: 'Not a length we understand' }),
  ).toBeVisible();
});

test('Hungarian: findings and the map speak Hungarian, with no keys leaking', async ({ page }) => {
  await withResults(page);
  await page.getByRole('radio', { name: 'HU' }).check({ force: true });
  await expect(page.getByRole('heading', { name: 'Miért' })).toBeVisible();
  await expect(page.getByRole('radiogroup', { name: 'Térképréteg' })).toBeVisible();
  await expect(page.locator('article').first()).toContainText(/Piros zászló|Figyelem/);
  const body = await page.locator('body').innerText();
  expect(body).not.toMatch(/finding\.[A-Z]\d\d|\{\w+\}/);
});
