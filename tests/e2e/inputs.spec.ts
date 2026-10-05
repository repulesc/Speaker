import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import {
  fillRoom,
  group,
  goStep,
  openApp,
  openSpeakerDetails,
  openWhy,
  savedProject,
  seatDistance,
  openTab,
} from './helpers';

test.use({ locale: 'en-GB' });

test('journey 1 — first answer: room, speaker, then results within 3 seconds', async ({ page }) => {
  await openApp(page);
  await fillRoom(page, '4', '5', '2.5');
  await goStep(page, 'Speakers');
  await page.getByRole('radio', { name: /Coaxial active monitor/ }).check();
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
  await page.getByRole('radio', { name: /Coaxial active monitor/ }).check();
  await goStep(page, 'Results');
  await expect(page.getByTestId('suggestion')).toBeVisible();

  await goStep(page, 'Room');
  await page.getByLabel('Ceiling height').fill('3.2');
  await page.getByLabel('Ceiling height').blur();
  await goStep(page, 'Results');
  await expect(page.getByTestId('suggestion')).toBeVisible();

  await expect(page.locator('#plan-desc')).toContainText('4.00');
  await goStep(page, 'Room');
  await expect(page.getByLabel('Width', { exact: true })).toHaveValue('4.00\u00a0m');
  await expect(page.getByLabel('Ceiling height')).toHaveValue('3.20\u00a0m');
  await goStep(page, 'Speakers');
  await openSpeakerDetails(page);
  await expect(group(page, 'speakers').getByLabel('Width', { exact: true })).toHaveValue(
    '16\u00a0cm',
  ); // the coaxial type's size
});

test.describe('with a room', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
    await fillRoom(page, '4', '5', '2.5');
  });

  test('journey 3 — variants are independent, and undo restores a move', async ({ page }) => {
    const original = await seatDistance(page);
    const seat = page.getByRole('button', { name: /^Seat\./ }).first();
    await seat.focus();
    await page.keyboard.press('Shift+ArrowDown');
    await page.keyboard.press('Shift+ArrowDown');
    expect(await seatDistance(page)).toBeCloseTo(original + 0.2, 2);

    await page.getByRole('button', { name: '+ New setup' }).click();
    await expect(page.getByRole('tab')).toHaveCount(2);
    expect(await seatDistance(page)).toBeCloseTo(original + 0.2, 2); // a copy of the first

    await page
      .getByRole('button', { name: /^Seat\./ })
      .first()
      .focus();
    await page.keyboard.press('Shift+ArrowDown');
    await page.keyboard.press('Shift+ArrowDown');
    expect(await seatDistance(page)).toBeCloseTo(original + 0.4, 2);

    await page.getByRole('tab').first().click();
    expect(await seatDistance(page)).toBeCloseTo(original + 0.2, 2); // the first setup is untouched

    await page.getByRole('tab').nth(1).click();
    await page.locator('h2').first().click(); // leave the drawing so the shortcut acts on the project
    await page.keyboard.press('Control+z');
    expect(await seatDistance(page)).toBeCloseTo(original + 0.2, 2); // both moves were one undo step
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

    await page.locator('h2').first().click();
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

  test('furnishing: add, rename, move, remove', async ({ page }) => {
    await goStep(page, 'Furnishing');
    await page.getByRole('button', { name: '+ Bed' }).click();
    await page.getByLabel('Name (optional)').fill('Guest bed');
    await page.getByLabel('Name (optional)').blur();
    const bed = page.getByRole('button', { name: /^Guest bed\./ }).first();
    await expect(bed).toBeVisible();
    await bed.focus();
    await page.keyboard.press('Shift+ArrowUp');
    await expect(
      group(page, 'furnishing').getByRole('textbox', { name: 'From the front wall' }),
    ).not.toHaveValue('');

    const project = await savedProject(page);
    expect(project.variants[0].objects).toHaveLength(1);
    expect(project.variants[0].objects[0]).toMatchObject({ kind: 'bed', label: 'Guest bed' });

    await page.getByRole('button', { name: 'Remove', exact: true }).click();
    await expect(page.getByRole('button', { name: /^Guest bed\./ })).toHaveCount(0);
  });

  test('furnishing: the quick "how full" answer is saved', async ({ page }) => {
    await goStep(page, 'Furnishing');
    await page.getByRole('radio', { name: 'Busy', exact: true }).check();
    const project = await savedProject(page);
    expect(project.variants[0].busyness).toEqual({ value: 'busy', certainty: 'estimated' });
  });

  test('surfaces: a wall of CDs on the left, with a shelf patch that can be dragged and typed', async ({
    page,
  }) => {
    await goStep(page, 'Surfaces');
    // One choice for all four walls, most common finishes first.
    await page.getByLabel('Walls', { exact: true }).selectOption({ label: 'Plasterboard' });
    // Shelves, windows and curtains go on a wall as "something on it".
    await page.getByText('Add something on a wall').click();
    await page.getByRole('radio', { name: /^Left wall/ }).check({ force: true });
    await page.getByRole('button', { name: '+ Shelf or CD wall' }).click();
    const patchWidth = group(page, 'surfaces').getByLabel('Width', { exact: true });
    await patchWidth.fill('1.5');
    await patchWidth.blur();

    // Drag the patch along the wall.
    const patch = page.getByRole('button', { name: /Bookshelf or CD wall, .* along/ });
    const before = await savedProject(page);
    const u0 = before.surfaces.patches[0].u;
    const box = (await patch.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2, { steps: 6 });
    await page.mouse.up();

    const project = await savedProject(page);
    for (const wall of ['front', 'back', 'left', 'right']) {
      expect(project.surfaces.base[wall]).toBe('gypsum-stud');
      expect(project.surfaces.baseCertainty[wall]).toBe('estimated');
    }
    expect(project.surfaces.patches[0].boundary).toBe('left');
    expect(project.surfaces.patches).toHaveLength(1);
    expect(project.surfaces.patches[0].width).toBeCloseTo(1.5, 6);
    expect(project.surfaces.patches[0].u).not.toBeCloseTo(u0, 2);
  });

  test('surfaces: "I don\'t know" goes back to the typical default', async ({ page }) => {
    await goStep(page, 'Surfaces');
    const floor = page.getByLabel('Floor', { exact: true });
    await floor.selectOption({ label: 'Thick carpet' });
    expect((await savedProject(page)).surfaces.base.floor).toBe('carpet-heavy');
    await floor.selectOption('unknown');
    const project = await savedProject(page);
    expect(project.surfaces.base.floor).toBe('wood-floor');
    expect(project.surfaces.baseCertainty.floor).toBe('unknown');
  });

  test('speakers: typed placement updates the drawing', async ({ page }) => {
    await goStep(page, 'Speakers');
    await page.getByLabel('Distance between the speakers').fill('2.4');
    await page.getByLabel('Distance between the speakers').blur();
    await expect(page.locator('#plan-desc')).toContainText(/Speakers 2\.40\u00a0m apart/);

    await openSpeakerDetails(page);
    await page.getByLabel('Toe-in (degrees)').fill('12');
    await page.getByLabel('Toe-in (degrees)').blur();
    const project = await savedProject(page);
    expect(project.variants[0].speakers.left.toeInDeg).toBe(12);
    expect(project.variants[0].speakers.right.toeInDeg).toBe(12);
  });

  test('speakers: "fixed" limits the suggestions, not your own moves', async ({ page }) => {
    await goStep(page, 'Speakers');
    await page.getByRole('radio', { name: 'No, it is fixed' }).check();
    await page.getByLabel('My speakers can’t move (only suggest a better seat)').check();
    const project = await savedProject(page);
    expect(project.constraints.listenerFixed).toBe(true);
    expect(project.constraints.speakersFixed).toBe(true);
    // You can still put the seat where it really is.
    const seat = page.getByRole('button', { name: /^Seat\./ }).first();
    const before = await seatDistance(page);
    await seat.focus();
    await page.keyboard.press('Shift+ArrowDown');
    expect(await seatDistance(page)).toBeCloseTo(before + 0.1, 2);
    // With nothing allowed to move, the home page says so instead of suggesting anything.
    await goStep(page, 'Results');
    await expect(page.getByText(/both the seat and the speakers as fixed/)).toBeVisible();
  });

  test('speakers: how far they may move (the zone) is one choice', async ({ page }) => {
    await goStep(page, 'Speakers');
    const zone = page.getByRole('radiogroup', { name: /How far can the speakers move/ });
    await expect(zone.getByRole('radio', { name: '50 cm' })).toBeChecked(); // the default
    await zone.getByRole('radio', { name: '25 cm' }).check({ force: true });
    expect((await savedProject(page)).constraints.speakerZone).toBe(0.25);
    await zone.getByRole('radio', { name: 'Anywhere' }).check({ force: true });
    expect((await savedProject(page)).constraints.speakerZone).toBeUndefined();
  });

  test('speaker file: save, change, load', async ({ page }) => {
    await goStep(page, 'Speakers');
    await openSpeakerDetails(page);
    await page.getByLabel('Brand (for your own reference)').fill('Acme');
    await page.getByLabel('Model (for your own reference)').fill('Studio 5');
    await page.getByLabel('Model (for your own reference)').blur();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Save speaker file' }).click(),
    ]);
    expect(download.suggestedFilename()).toBe('Acme Studio 5.speaker-profile.json');
    const path = await download.path();
    expect(JSON.parse(readFileSync(path, 'utf8')).speaker.brand).toBe('Acme');

    await page.getByLabel('Brand (for your own reference)').fill('Other');
    await page.getByLabel('Brand (for your own reference)').blur();
    await page.locator('#speaker-file').setInputFiles(path);
    await expect(page.getByLabel('Brand (for your own reference)')).toHaveValue('Acme');

    await page.locator('#speaker-file').setInputFiles({
      name: 'bad.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"nope":true}'),
    });
    await expect(page.getByRole('alert')).toContainText('does not contain a speaker');
    await expect(page.getByLabel('Brand (for your own reference)')).toHaveValue('Acme');
  });

  test('goals: wide and precise together explain the trade-off', async ({ page }) => {
    await goStep(page, 'Goals');
    await page
      .getByRole('radiogroup', { name: 'Wide soundstage' })
      .getByRole('radio', { name: 'Important' })
      .check();
    await expect(page.getByText(/pull in different directions/)).toHaveCount(0);
    await page
      .getByRole('radiogroup', { name: 'Precise imaging' })

      .getByRole('radio', { name: 'Nice to have' })
      .check();
    await expect(page.getByText(/pull in different directions/)).toBeVisible();
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
