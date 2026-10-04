import { expect, test } from '@playwright/test';
import { fillRoom, openSection } from './helpers';

test.use({ locale: 'en-GB' });

test('the page title, manifest and icons all come from the one app-name setting', async ({
  page,
}) => {
  await page.goto('/');
  const title = await page.title();
  expect(title.length).toBeGreaterThan(0);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);

  const manifest = await (await page.request.get('/manifest.webmanifest')).json();
  expect(manifest.name).toBe(title);
  expect(manifest.display).toBe('standalone');
  for (const icon of manifest.icons) {
    expect((await page.request.get(`/${icon.src}`)).ok(), icon.src).toBe(true);
  }
});

test('after the first visit the app opens offline, with the saved project', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await fillRoom(page, '4', '5.2', '2.6');
  await page.getByText('Saved on this device').waitFor();

  // Wait until the service worker controls the page, then reload so every asset is cached.
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await page.reload();
  await openSection(page, 'Room'); // a project with a room opens on the results
  await expect(page.getByLabel('Width', { exact: true })).toHaveValue('4.00 m');

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Why' })).toBeVisible();
  await openSection(page, 'Room');
  await expect(page.getByLabel('Width', { exact: true })).toHaveValue('4.00 m');
  // The engine runs in a worker that must also come from the cache.
  await expect(page.getByRole('button', { name: /How sure are we/ })).toContainText(
    'First impression',
  );
  await context.setOffline(false);
});
