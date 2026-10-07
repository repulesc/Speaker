import { expect, test } from '@playwright/test';
import {
  describeSpeakers,
  fillRoom,
  group,
  goStep,
  openApp,
  openPositions,
  openSpeakerDetails,
  openWhy,
  savedProject,
  seatDistance,
  setMoves,
  openTab,
} from './helpers';

test.use({ locale: 'en-GB' });

test('journey 1 — first answer: room, speaker, then results within 3 seconds', async ({ page }) => {
  await openApp(page);
  await fillRoom(page, '4', '5', '2.5');
  await goStep(page, 'Speakers');
  await describeSpeakers(page);
  await page.getByLabel('What kind of speakers?').selectOption('monitor');
  await page.getByLabel('Drivers', { exact: true }).selectOption('coaxial');
  await goStep(page, 'Results');

  await expect(page.getByTestId('suggestion')).toBeVisible({ timeout: 3000 });
  await expect(page.getByTestId('score-current')).toBeAttached();
  await expect(page.getByTestId('score-best')).toBeAttached();
  await openWhy(page);
  await expect(page.getByTestId('confidence-word')).toBeVisible();
  await expect(page.getByTestId('finding-counts')).toHaveText(/Red flags: \d+ · Cautions: \d+/);
});

test('journey 2 — edit without restart: change the ceiling, results follow, nothing is lost', async ({
  page,
}) => {
  await openApp(page);
  await fillRoom(page, '4', '5', '2.5');
  await goStep(page, 'Speakers');
  await describeSpeakers(page);
  await page.getByLabel('What kind of speakers?').selectOption('monitor');
  await page.getByLabel('Drivers', { exact: true }).selectOption('coaxial');
  await goStep(page, 'Results');
  await expect(page.getByTestId('suggestion')).toBeVisible();

  await goStep(page, 'Room');
  await page.getByLabel('Ceiling height').fill('3.2');
  await page.getByLabel('Ceiling height').blur();
  await goStep(page, 'Results');
  await expect(page.getByTestId('suggestion')).toBeVisible();

  await expect(page.locator('#plan-desc')).toContainText('4.00');
  await goStep(page, 'Room');
  await expect(group(page, 'room').getByLabel('Width', { exact: true })).toHaveValue('4.00\u00a0m');
  await expect(page.getByLabel('Ceiling height')).toHaveValue('3.20\u00a0m');
  await goStep(page, 'Speakers');
  await openSpeakerDetails(page);
  await expect(group(page, 'speakers').getByLabel('Width', { exact: true })).toHaveValue(
    '19\u00a0cm',
  ); // a medium monitor's typical width
});

test.describe('with a room', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
    await fillRoom(page, '4', '5', '2.5');
  });

  test('journey 3 — a move made in two key presses is one undo step', async ({ page }) => {
    const original = await seatDistance(page);
    const seat = page.getByRole('button', { name: /^Seat\./ }).first();
    await seat.focus();
    await page.keyboard.press('Shift+ArrowDown');
    await page.keyboard.press('Shift+ArrowDown');
    expect(await seatDistance(page)).toBeCloseTo(original + 0.2, 2);

    await page.locator('#panel .mast').click(); // leave the drawing so the shortcut acts on the project
    await page.keyboard.press('Control+z');
    expect(await seatDistance(page)).toBeCloseTo(original, 2); // both moves were one undo step
    await page.keyboard.press('Control+Shift+z');
    expect(await seatDistance(page)).toBeCloseTo(original + 0.2, 2);
  });

  test('dragging the seat with the mouse moves it, and is one undo step', async ({ page }) => {
    const before = await seatDistance(page);
    const box = (await page
      .getByRole('button', { name: /^Seat\./ })
      .first()
      .boundingBox())!;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx, cy + 40, { steps: 8 });
    await page.mouse.up();
    const after = await seatDistance(page);
    expect(after).toBeGreaterThan(before + 0.15);

    await page.locator('#panel .mast').click();
    await page.keyboard.press('Control+z');
    expect(await seatDistance(page)).toBeCloseTo(before, 2);
  });

  test('speakers are mirrored by default and move together', async ({ page }) => {
    const left = page.getByRole('button', { name: /^Left speaker\./ }).first();
    const right = page.getByRole('button', { name: /^Right speaker\./ }).first();
    await left.focus();
    for (let i = 0; i < 3; i++) await page.keyboard.press('Shift+ArrowLeft');
    const l = await left.getAttribute('aria-label');
    const r = await right.getAttribute('aria-label');
    const side = (label: string | null) =>
      /([\d.]+\s+c?m) from the nearest side wall/.exec(label ?? '')?.[1];
    expect(side(l)).toBeDefined();
    expect(side(l)).toBe(side(r));
  });

  test('room: the quick "how full" answer is saved', async ({ page }) => {
    await goStep(page, 'Room');
    await page.getByRole('radio', { name: 'Busy', exact: true }).check({ force: true });
    const project = await savedProject(page);
    expect(project.variants[0].busyness).toEqual({ value: 'busy', certainty: 'estimated' });
  });

  test('surfaces: one choice for all walls; "Not sure" goes back to the typical default', async ({
    page,
  }) => {
    await goStep(page, 'Surfaces');
    await page.getByLabel('Walls', { exact: true }).selectOption({ label: 'Plasterboard' });
    const walls = await savedProject(page);
    for (const wall of ['front', 'back', 'left', 'right']) {
      expect(walls.surfaces.base[wall]).toBe('gypsum-stud');
      expect(walls.surfaces.baseCertainty[wall]).toBe('estimated');
    }
    const floor = page.getByLabel('Floor', { exact: true });
    await floor.selectOption({ label: 'Thick carpet' });
    expect((await savedProject(page)).surfaces.base.floor).toBe('carpet-heavy');
    await floor.selectOption('');
    const project = await savedProject(page);
    expect(project.surfaces.base.floor).toBe('wood-floor');
    expect(project.surfaces.baseCertainty.floor).toBe('unknown');
  });

  test('positions: typed values update the drawing', async ({ page }) => {
    await openPositions(page);
    await page.getByLabel('Between the speakers', { exact: true }).fill('2.4');
    await page.getByLabel('Between the speakers', { exact: true }).blur();
    await expect(page.locator('#plan-desc')).toContainText(/Speakers 2\.40\u00a0m apart/);

    await page.getByLabel('Toe-in (°)').fill('12');
    await page.getByLabel('Toe-in (°)').blur();
    const project = await savedProject(page);
    expect(project.variants[0].speakers.left.toeInDeg).toBe(12);
    expect(project.variants[0].speakers.right.toeInDeg).toBe(12);
  });

  test('what moves limits the suggestions, not your own moves', async ({ page }) => {
    await setMoves(page, 'Speakers');
    expect((await savedProject(page)).constraints.listenerFixed).toBe(true);
    // You can still put the seat where it really is.
    const seat = page.getByRole('button', { name: /^Seat\./ }).first();
    const before = await seatDistance(page);
    await seat.focus();
    await page.keyboard.press('Shift+ArrowDown');
    expect(await seatDistance(page)).toBeCloseTo(before + 0.1, 2);
    await setMoves(page, 'Seat');
    const project = await savedProject(page);
    expect(project.constraints.speakersFixed).toBe(true);
    expect(project.constraints.listenerFixed).toBe(false);
  });

  test('speakers: how far they may move (the zone) is one choice', async ({ page }) => {
    await goStep(page, 'Room');
    const zone = page.getByRole('radiogroup', { name: 'The speakers may move' });
    await expect(zone.getByRole('radio', { name: '50 cm' })).toBeChecked(); // the default
    await zone.getByRole('radio', { name: '25 cm' }).check({ force: true });
    expect((await savedProject(page)).constraints.speakerZone).toBe(0.25);
    await zone.getByRole('radio', { name: 'Anywhere' }).check({ force: true });
    expect((await savedProject(page)).constraints.speakerZone).toBeUndefined();
  });

  test('goals: wide and precise together explain the trade-off', async ({ page }) => {
    await goStep(page, 'Goals');
    const goals = group(page, 'goals');
    await goals.getByRole('button', { name: 'Wide soundstage' }).click();
    await expect(goals.getByRole('button', { name: 'Wide soundstage' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByText(/pull in different directions/)).toHaveCount(0);
    await goals.getByRole('button', { name: 'Precise imaging' }).click();
    await expect(page.getByText(/pull in different directions/)).toBeVisible();
    expect((await savedProject(page)).goals.weights).toMatchObject({
      'wide-stage': 2,
      'precise-imaging': 2,
    });
  });

  test('the side view shows heights and can be used with the keyboard', async ({ page }) => {
    await openTab(page, 'Why');
    await page.getByRole('button', { name: 'Side view' }).click(); // hidden until asked for
    const ears = page.getByRole('button', { name: /^Seat\. .* above the floor\. Left and right/ });
    await ears.focus();
    await page.keyboard.press('Shift+ArrowUp');
    const label = await ears.getAttribute('aria-label');
    expect(label).toMatch(/ears 1\.20\u00a0m above the floor/);
  });
});
