import { expect, test } from '@playwright/test';
import { fillRoom, goHome, openApp, openSection, savedProject, setMoves } from './helpers';

/**
 * V11 (docs/ROADMAP_V11.md): the title, the centred mark, the address as the room, and the
 * converged state after Apply.
 */
test.use({ locale: 'en-GB' });

test('the tab says NODO and the mark sits on the header’s centre line', async ({ page }) => {
  await openApp(page);
  await expect(page).toHaveTitle('NODO');
  const centre = async (selector: string) => {
    const box = (await page.locator(selector).first().boundingBox())!;
    return box.x + box.width / 2;
  };
  expect(
    Math.abs((await centre('.mast .centre .brand')) - (await centre('.mast > .bar'))),
  ).toBeLessThan(6);
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await expect(page.getByText('Rooms on this device')).toHaveCount(0);
  await page
    .locator('#menu-drawer')
    .evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
  expect(
    Math.abs((await centre('#menu-drawer .brand')) - (await centre('#menu-drawer .bar'))),
  ).toBeLessThan(6);
});

test('the address is the room: it follows the room, and a bare visit restores the last one', async ({
  page,
}) => {
  await openApp(page);
  await fillRoom(page, '4.2', '5.6', '2.6');
  await expect.poll(() => page.url()).toContain('#p=');
  // The same address, opened again, shows the same room.
  const address = page.url();
  await page.goto('about:blank');
  await page.goto(address);
  await openSection(page, 'Room');
  await expect(page.getByLabel('Width', { exact: true })).toHaveValue('4.20 m');
  // A bare visit gets the last room back from this device.
  await page.goto('/');
  await openSection(page, 'Room');
  await expect(page.getByLabel('Length', { exact: true })).toHaveValue('5.60 m');
});

test('after Apply the position is locked, moving ends it, and Back undoes the Apply', async ({
  page,
}) => {
  await openApp(page);
  await fillRoom(page, '4', '5.2', '2.6');
  await goHome(page);
  await setMoves(page, 'Both');
  await expect(page.getByTestId('suggestion')).toBeVisible();
  await expect(page.getByTestId('idea-name')).toBeVisible();
  const before = (await savedProject(page)).variants[0].listener.ears.y;

  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  const locked = page.getByTestId('converged');
  await expect(locked).toHaveText('Optimised position active');
  await expect(page.getByTestId('suggestion')).toHaveCount(0);
  const applied = (await savedProject(page)).variants[0].listener.ears.y;

  // Nothing new appears by itself, and the state survives a reload.
  await page.reload();
  await goHome(page);
  await expect(page.getByTestId('converged')).toBeVisible();

  // Back goes to the layout before Apply.
  await page.goBack();
  await expect
    .poll(async () => (await savedProject(page)).variants[0].listener.ears.y)
    .toBeCloseTo(before, 2);
  await expect(page.getByTestId('converged')).toHaveCount(0);
  expect(applied).not.toBeCloseTo(before, 2);

  // Forward is the applied layout again; "Look again" brings the suggestions back.
  await page.goForward();
  await expect(page.getByTestId('converged')).toBeVisible();
  await page.getByRole('button', { name: 'Look again' }).click();
  await expect(page.getByTestId('suggestion')).toBeVisible();
});
