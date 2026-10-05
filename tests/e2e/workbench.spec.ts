import { expect, test, type Page } from '@playwright/test';
import {
  fillRoom,
  goHome,
  goStep,
  mapChoice,
  openApp,
  openMenu,
  openSection,
  openWhy,
  savedProject,
  setMoves,
} from './helpers';

test.use({ locale: 'en-GB' });

/** A room with the default speakers, open on the home page with the best placement. */
async function withResults(page: Page) {
  await openApp(page);
  await fillRoom(page, '4', '5', '2.5');
  await goStep(page, 'Results');
  await expect(page.getByTestId('suggestion')).toBeVisible();
}

test('the map shows a heatmap, layers that say what they mean, and a legend', async ({ page }) => {
  await withResults(page);
  await expect(page.locator('canvas.heat')).toBeVisible();
  // Two big choices; the layers that explain a seat sit behind "Why?" (docs/ROADMAP_V5.md).
  await mapChoice(page, 'Seat').check({ force: true });
  await expect(page.getByRole('button', { name: 'Bass holes' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Why?' }).click();
  const reasons = page.getByRole('group', { name: 'What makes a seat good or poor' });
  await expect(reasons.getByRole('button')).toHaveCount(6);
  await reasons.getByRole('button', { name: 'Bass holes' }).click();
  await expect(page.getByText('Whether a bass note nearly vanishes here')).toBeVisible();
  await expect(page.getByText('Physics', { exact: false }).first()).toBeVisible();
  await expect(page.getByText('Poorer')).toBeVisible();
  await reasons.getByRole('button', { name: 'Bass holes' }).click(); // back to the seat map
  await expect(page.getByTestId('best-here')).toHaveText(/^Best here: (Poor|Fair|Good|Very good)$/);
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
  await openWhy(page);
  const counts = page.getByTestId('finding-counts');
  await expect(counts).toHaveText(/Red flags: \d+ · Cautions: \d+/);
  const first = page.locator('article').first();
  await expect(first).toContainText(/Red flag|Caution/);
  await expect(first).toContainText(/Physics|Guideline|Rule of thumb/);
  const body = await page.locator('body').innerText();
  expect(body).not.toMatch(/finding\.[A-Z]\d\d|advice\.[A-Z]\d\d|\{\w+\}/);
});

test('best placement: shown first, other options, apply, and undo brings the setup back', async ({
  page,
}) => {
  await withResults(page);
  // Both move (the default is speakers only, with the seat fixed).
  await setMoves(page, 'Both');
  const before = (await savedProject(page)).variants[0].listener.ears.y;
  const answer = page.getByTestId('suggestion');
  // Wait for the new answer: the suggested seat is no longer the current one.
  await expect
    .poll(async () => {
      const text = await answer.innerText();
      const m = /([\d.]+)\u00a0m from the front wall, [\d.]+\u00a0m from each/.exec(text);
      return m ? Math.abs(Number(m[1]) - before) : 0;
    })
    .toBeGreaterThan(0.05);
  await expect(answer).toContainText(/from the front wall/);
  await expect(answer).toContainText(/apart/);
  await page.getByRole('radio', { name: /^Option B/ }).check({ force: true });
  await expect(page.getByRole('radio', { name: /^Option B/ })).toBeChecked();
  await page.getByRole('radio', { name: /^Option A/ }).check({ force: true });

  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Placement applied' })).toBeVisible();
  const moved = (await savedProject(page)).variants[0];
  expect(moved.listener.ears.y).not.toBeCloseTo(before, 2);
  expect(moved.speakers.left.certainty).toBe('estimated');

  await page.getByRole('heading', { name: 'Best placement' }).click();
  await page.keyboard.press('Control+z');
  await expect
    .poll(async () => (await savedProject(page)).variants[0].listener.ears.y)
    .toBeCloseTo(before, 2);
});

test('"speakers only": the seat stays, and room listening keeps 1.5 m', async ({ page }) => {
  await withResults(page);
  await setMoves(page, 'Speakers');
  await expect(page.getByTestId('suggestion')).toContainText('Stays where it is');
  const project = await savedProject(page);
  expect(project.constraints.listenerFixed).toBe(true);
  await page.getByRole('radio', { name: 'Desk' }).check({ force: true });
  await expect
    .poll(async () => (await savedProject(page)).constraints.listeningDistance)
    .toBe('near');
});

test('the probe: click the map to see why, then move the seat there', async ({ page }) => {
  await withResults(page);
  await mapChoice(page, 'Seat').check({ force: true }); // the seat map
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

test('on the speaker map, a click offers to move the speakers there', async ({ page }) => {
  await withResults(page);
  await expect(mapChoice(page, 'Speakers')).toBeChecked(); // speakers only: the default
  const plan = page.getByRole('group', { name: 'Top view of the room' });
  const box = (await plan.boundingBox())!;
  const before = (await savedProject(page)).variants[0].speakers.left.base;
  // Upper left of the room, where the left speaker could stand.
  await page.mouse.click(box.x + box.width * 0.33, box.y + box.height * 0.3);
  const card = page.getByRole('region', { name: 'Speakers here' });
  await expect(card).toContainText(/Speakers here: (Poor|Fair|Good|Very good)/);
  await card.getByRole('button', { name: 'Move the speakers here' }).click();
  await expect(card).toHaveCount(0);
  const after = (await savedProject(page)).variants[0].speakers.left.base;
  expect(Math.hypot(after.x - before.x, after.y - before.y)).toBeGreaterThan(0.05);
});

test('click a number on the map to type an exact value', async ({ page }) => {
  await withResults(page);
  // The seat's numbers show once the seat is selected (or hovered).
  await page
    .getByRole('button', { name: /^Seat\./ })
    .first()
    .focus();
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
  await openMenu(page);
  await page.getByRole('radio', { name: 'HU' }).check({ force: true });
  await page.keyboard.press('Escape');
  await openSection(page, 'Miért ez az eredmény');
  await expect(page.getByRole('heading', { name: 'Miért' })).toBeVisible();
  await expect(page.getByLabel('Térképréteg')).toBeVisible();
  await expect(page.locator('article').first()).toContainText(/Piros zászló|Figyelem/);
  const body = await page.locator('body').innerText();
  expect(body).not.toMatch(/finding\.[A-Z]\d\d|\{\w+\}/);
});

test('the Treat tab lists advice in order, with no raw keys', async ({ page }) => {
  await withResults(page);
  await openSection(page, 'Improve the room');
  await expect(page.getByRole('heading', { name: 'Treat the room' })).toBeVisible();
  await expect(page.getByText('If you can only do one thing')).toBeVisible();
  const text = await page.locator('#panel').innerText();
  expect(text).not.toMatch(/\b(advice|treat|finding)\.[A-Za-z0-9]+/);
  await goHome(page);
  await expect(page.getByTestId('suggestion')).toBeVisible();
});

test('the bass-note explorer shows a pressure pattern and the resonances near the note', async ({
  page,
}) => {
  await openApp(page);
  await fillRoom(page, '4', '5', '2.5');
  await goStep(page, 'Results');
  await expect(page.getByTestId('suggestion')).toBeVisible();
  const chip = page.getByRole('button', { name: 'Bass note' });
  await expect(chip).toHaveAttribute('aria-pressed', 'false');
  await chip.click();
  await expect(chip).toHaveAttribute('aria-pressed', 'true');
  const slider = page.getByRole('slider', { name: 'Frequency' });
  await expect(slider).toBeVisible();
  await expect(page.getByText(/Bass note at 60 Hz/)).toBeVisible();
  await page
    .getByRole('button', { name: /^Jump to \d+ Hz$/ })
    .first()
    .click();
  await expect(page.getByText(/Room resonances near this note/)).toBeVisible();
  await chip.click();
  await expect(page.getByText('Poorer')).toBeVisible();
});

test('furniture: a bigger palette and a material for any object', async ({ page }) => {
  await withResults(page);
  await goStep(page, 'Furnishing');
  await page.getByRole('button', { name: '+ Piano' }).click();
  await page.getByRole('button', { name: '+ Bookcase' }).click();
  const material = page.getByLabel('Material');
  await expect(material).toBeVisible();
  await material.selectOption('absorbent');
  await expect(material).toHaveValue('absorbent');
  await page.getByRole('button', { name: '+ Other object' }).click();
  await expect(page.getByLabel('Material')).toHaveValue('soft');
});

test('the Listen tab saves a rated note, shows the tip and the agreement text', async ({
  page,
}) => {
  await withResults(page);
  await openSection(page, 'Listening notes');
  await expect(page.getByRole('heading', { name: 'Listen and note' })).toBeVisible();
  await expect(page.getByTestId('agreement')).toContainText('Rate at least two');
  await page.getByRole('radio', { name: '4 of 5' }).check({ force: true });
  await page.getByLabel('Boomy, heavy bass').check();
  await page.getByLabel('Your note (optional)').fill('after an evening');
  await page.getByRole('button', { name: 'Save note' }).click();
  await expect(page.getByText('after an evening')).toBeVisible();
  await expect(page.getByText(/Move your seat about 20 cm forward/)).toBeVisible();
  const text = await page.locator('#panel').innerText();
  expect(text).not.toMatch(/\blisten\.[A-Za-z]/);
  await page.getByRole('button', { name: 'Delete note' }).click();
  await expect(page.getByText('No notes for this setup yet.')).toBeVisible();
});

test('compare: a second setup appears as a dashed line and a verdict', async ({ page }) => {
  await withResults(page);
  await expect(page.getByRole('heading', { name: 'Compare setups' })).toHaveCount(0);
  await page.getByRole('button', { name: '+ New setup' }).click();
  await openWhy(page);
  await page.getByLabel('Compare with').selectOption({ index: 1 });
  await expect(page.getByTestId('compare-scores')).toBeVisible();
  // The bass chart has its own page; the comparison stays on while it is open.
  await openSection(page, 'Bass at your seat');
  await expect(page.locator('path.line.other')).toHaveCount(1);
  await openWhy(page);
  await page.getByLabel('Compare with').selectOption('');
  await openSection(page, 'Bass at your seat');
  await expect(page.locator('path.line.other')).toHaveCount(0);
});

test('the print sheet has the tape-measure numbers', async ({ page }) => {
  await withResults(page);
  await page.emulateMedia({ media: 'print' });
  const sheet = page.locator('.print-sheet');
  await expect(sheet).toBeVisible();
  await expect(sheet).toContainText('from the front wall');
  await expect(sheet).toContainText('Left speaker');
  await expect(page.locator('.app')).toBeHidden();
});

test('the speaker layer shows where the speakers would sound best, mirrored about the seat', async ({
  page,
}) => {
  await withResults(page);
  await mapChoice(page, 'Speakers').check({ force: true });
  await expect(page.getByText(/Where the speakers would sound best/)).toBeVisible();
  const canvas = page.locator('canvas.heat');
  await expect(canvas).toBeVisible();
  // Mirrored: the canvas is twice as wide as the half grid, and not blank.
  const sample = await canvas.evaluate((el: HTMLCanvasElement) => {
    const ctx = el.getContext('2d')!;
    const { data } = ctx.getImageData(0, 0, el.width, el.height);
    let left = 0;
    let right = 0;
    for (let y = 0; y < el.height; y++) {
      for (let x = 0; x < el.width; x++) {
        const a = data[(y * el.width + x) * 4 + 3]!;
        if (a && x < el.width / 2) left++;
        if (a && x >= el.width / 2) right++;
      }
    }
    return { left, right };
  });
  expect(sample.left).toBeGreaterThan(50);
  expect(sample.right).toBe(sample.left);
});

test('share as image: the menu saves a picture of the room and the answer', async ({ page }) => {
  await withResults(page);
  await openMenu(page);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Share as image' }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('Untitled room.png');
  const path = await download.path();
  const { size } = await import('node:fs').then((fs) => fs.statSync(path));
  expect(size).toBeGreaterThan(20_000); // a real picture, not an empty canvas
});
