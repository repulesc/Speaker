import { expect, test, type Page } from '@playwright/test';
import { fillRoom, goHome, openSection, openSpeakerDetails } from './helpers';

test.use({ locale: 'en-GB' });

/** The sidebar uses three text sizes only (docs/DESIGN_BRIEF_V3.md, item 6): 13, 15 and 22 px. */
const SCALE = [13, 15, 22];

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
  await page.goto('/');
  await fillRoom(page, '4', '5', '2.5');
  const pages: Array<() => Promise<void>> = [
    () => goHome(page),
    () => openSection(page, 'Room'),
    () => openSection(page, 'Surfaces'),
    () => openSection(page, 'Furniture'),
    async () => {
      await openSection(page, 'Speakers');
      await openSpeakerDetails(page);
    },
    () => openSection(page, 'Goals'),
    () => openSection(page, 'Why this result'),
    () => openSection(page, 'Improve the room'),
    () => openSection(page, 'Bass at your seat'),
    () => openSection(page, 'Listening notes'),
  ];
  for (const open of pages) {
    await open();
    await expect(page.locator('#panel h2').first()).toBeVisible();
    const sizes = await panelSizes(page);
    expect(Object.keys(sizes).length).toBeGreaterThan(1); // the walk found text
    const off = Object.entries(sizes).filter(([size]) => !SCALE.includes(parseFloat(size)));
    expect(off, `off-scale text: ${JSON.stringify(off)}`).toEqual([]);
  }
});
