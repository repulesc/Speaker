import { expect, test, type Page } from '@playwright/test';
import { fillRoom, goHome, openApp, openMenu, openSection, openSpeakerDetails } from './helpers';

test.use({ locale: 'en-GB' });

/**
 * The sidebar uses three text sizes (docs/DESIGN_BRIEF_V3.md, item 6): 13, 15 and 22 px, plus the
 * serif display size for the project name and the verdict (docs/ROADMAP_V8.md, identity).
 */
const SCALE = [13, 15, 22, 26];

/** Font sizes of the visible text in the sidebar, drawings and hidden helper text left out. */
async function panelSizes(page: Page): Promise<Record<string, string>> {
  return page.locator('#panel').evaluate((panel) => {
    const found: Record<string, string> = {};
    const walker = document.createTreeWalker(panel, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const el = node.parentElement;
      if (!el || !node.textContent?.trim()) continue;
      if (
        el.closest(
          'svg, [aria-hidden="true"], .visually-hidden, details:not([open]) > :not(summary)',
        )
      )
        continue;
      const box = el.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) continue;
      const size = getComputedStyle(el).fontSize;
      found[size] ??=
        `${el.tagName.toLowerCase()}.${el.className}: ${node.textContent.trim().slice(0, 40)}`;
    }
    return found;
  });
}

test('the sidebar keeps to one type scale on every page', async ({ page }) => {
  await openApp(page);
  await fillRoom(page, '4', '5', '2.5');
  const pages: Array<() => Promise<void>> = [
    () => goHome(page),
    () => openSection(page, 'Room'),
    async () => {
      await openSection(page, 'Speakers');
      await openSpeakerDetails(page);
    },
    () => openSection(page, 'Positions'),
    () => openSection(page, 'Why this result'),
    () => openSection(page, 'Improve the room'),
    () => openSection(page, 'Bass at your seat'),
    () => openSection(page, 'Listening check'),
  ];
  for (const open of pages) {
    await open();
    await expect(page.locator('#step-panel h2').first()).toBeVisible();
    const sizes = await panelSizes(page);
    expect(Object.keys(sizes).length).toBeGreaterThan(1); // the walk found text
    const off = Object.entries(sizes).filter(([size]) => !SCALE.includes(parseFloat(size)));
    expect(off, `off-scale text: ${JSON.stringify(off)}`).toEqual([]);
  }
});

test('no sidebar page runs out of its panel, in English or Hungarian', async ({ page }) => {
  await openApp(page);
  await fillRoom(page, '4', '5', '2.5');
  const overflow = () =>
    page.locator('#panel').evaluate((panel) => {
      const wide: string[] = [];
      for (const el of panel.querySelectorAll('*')) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.right > panel.getBoundingClientRect().right + 1) {
          wide.push(`${el.tagName.toLowerCase()}.${el.className}`);
        }
      }
      return { scroll: panel.scrollWidth - panel.clientWidth, wide: wide.slice(0, 5) };
    });
  const sections = [
    'Room',
    'Speakers',
    'Positions',
    'Why this result',
    'Improve the room',
    'Listening check',
  ];
  for (const lang of ['EN', 'HU']) {
    for (const section of sections) {
      await goHome(page);
      await openSection(page, section);
      if (lang === 'HU') {
        await page.getByRole('button', { name: 'Menu', exact: true }).click();
        await page.getByRole('radio', { name: 'Magyar', exact: true }).check({ force: true });
        await page.keyboard.press('Escape');
      }
      const result = await overflow();
      expect(result, `${lang}: ${section}`).toEqual({ scroll: 0, wide: [] });
      if (lang === 'HU') {
        await page.getByRole('button', { name: 'Menü', exact: true }).click();
        await page.getByRole('radio', { name: 'English', exact: true }).check({ force: true });
        await page.keyboard.press('Escape');
      }
    }
  }
});

test('with the numbers shown, in Hungarian, nothing reaches into the panel padding (V9 bug)', async ({
  page,
}) => {
  await openApp(page);
  await fillRoom(page, '4.2', '5.8', '2.6');
  await openMenu(page);
  await page.getByRole('radio', { name: 'Magyar', exact: true }).check({ force: true });
  await page.getByRole('checkbox', { name: 'Számok mutatása' }).check({ force: true });
  await page.keyboard.press('Escape');
  await goHome(page);
  await expect(page.getByTestId('suggestion')).toBeVisible();
  const outside = await page.locator('#step-panel').evaluate((body) => {
    const box = body.getBoundingClientRect();
    const right = box.right - parseFloat(getComputedStyle(body).paddingRight) + 1;
    return [...body.querySelectorAll('*')]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.right > right;
      })
      .map((el) => `${el.tagName.toLowerCase()}.${el.className}`)
      .slice(0, 5);
  });
  expect(outside).toEqual([]);
});
