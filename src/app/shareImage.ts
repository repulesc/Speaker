/**
 * "Share as image" (owner decision, docs/DESIGN_BRIEF_V4.md): one clean picture of the room, its
 * map and the recommendation, made in the browser from what is on screen. Nothing leaves the
 * device unless the user shares the file.
 */

/** Presentation properties copied onto each SVG element, so the picture looks like the screen. */
const STYLE_PROPS = [
  'fill',
  'fill-opacity',
  'stroke',
  'stroke-width',
  'stroke-dasharray',
  'stroke-linecap',
  'stroke-linejoin',
  'opacity',
  'font-size',
  'font-weight',
  'font-family',
  'letter-spacing',
  'visibility',
  'display',
] as const;

/** The plan's SVG as an image, with computed styles inlined (CSS variables do not travel). */
async function svgImage(svg: SVGSVGElement): Promise<HTMLImageElement> {
  const copy = svg.cloneNode(true) as SVGSVGElement;
  const source = [svg, ...svg.querySelectorAll('*')];
  const target = [copy, ...copy.querySelectorAll('*')];
  source.forEach((element, i) => {
    const style = getComputedStyle(element);
    const out = target[i] as SVGElement;
    for (const prop of STYLE_PROPS) out.style.setProperty(prop, style.getPropertyValue(prop));
    // Transitions and drop shadows are screen-only.
    out.style.removeProperty('transition');
    out.style.removeProperty('filter');
    if (element instanceof SVGElement && style.transform !== 'none')
      out.style.setProperty('transform', style.transform);
  });
  // Dimension lines need their numbers, which are not part of the drawing: leave them out.
  copy.querySelectorAll('.dim').forEach((dim) => dim.remove());
  copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const blob = new Blob([new XMLSerializer().serializeToString(copy)], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export interface ShareText {
  title: string;
  subtitle: string;
  lines: string[];
  footer: string;
}

/** Wraps text to a width, word by word. */
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) {
      out.push(line);
      line = word;
    } else line = next;
  }
  if (line) out.push(line);
  return out;
}

/** Draws the picture: header, the room with its map, the answer, a quiet footer. */
export async function makeShareImage(plan: HTMLElement, text: ShareText): Promise<Blob | null> {
  const svg = plan.querySelector('svg');
  if (!svg) return null;
  const root = getComputedStyle(document.documentElement);
  const color = (name: string) => root.getPropertyValue(name).trim() || '#000';
  const font = getComputedStyle(document.body).fontFamily;

  const scale = 2;
  const width = 1080;
  const pad = 64;
  const box = svg.getBoundingClientRect();
  const mapW = width - 2 * pad;
  const mapH = (box.height / box.width) * mapW;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  // Measure the answer first, to size the picture: the sentence bold, the verdict quieter.
  const [first = '', ...rest] = text.lines;
  ctx.font = `600 32px ${font}`;
  const answer = wrap(ctx, first, mapW);
  ctx.font = `400 26px ${font}`;
  const detail = rest.flatMap((l) => wrap(ctx, l, mapW));
  const height = Math.round(pad + 120 + mapH + 40 + answer.length * 44 + detail.length * 38 + 100);
  canvas.width = width * scale;
  canvas.height = height * scale;
  ctx.scale(scale, scale);

  ctx.fillStyle = color('--surface');
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = color('--ink');
  ctx.font = `700 44px ${font}`;
  ctx.fillText(text.title, pad, pad + 40);
  ctx.fillStyle = color('--ink-muted');
  ctx.font = `400 26px ${font}`;
  ctx.fillText(text.subtitle, pad, pad + 84);

  // The map: the heat canvas under the drawing, at the same place as on screen.
  const top = pad + 120;
  const k = mapW / box.width;
  for (const heat of plan.querySelectorAll<HTMLCanvasElement>('canvas.heat')) {
    const r = heat.getBoundingClientRect();
    ctx.drawImage(
      heat,
      pad + (r.left - box.left) * k,
      top + (r.top - box.top) * k,
      r.width * k,
      r.height * k,
    );
  }
  ctx.drawImage(await svgImage(svg), pad, top, mapW, mapH);

  let y = top + mapH + 40;
  ctx.fillStyle = color('--ink');
  ctx.font = `600 32px ${font}`;
  for (const line of answer) {
    y += 44;
    ctx.fillText(line, pad, y);
  }
  ctx.fillStyle = color('--ink-muted');
  ctx.font = `400 26px ${font}`;
  y += 8;
  for (const line of detail) {
    y += 38;
    ctx.fillText(line, pad, y);
  }
  ctx.fillStyle = color('--ink-muted');
  ctx.font = `400 22px ${font}`;
  ctx.fillText(text.footer, pad, height - pad / 2 - 6);

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

/** Shares the picture where the device can (phones), otherwise saves it as a file. */
export async function shareOrSave(blob: Blob, fileName: string): Promise<void> {
  const file = new File([blob], fileName, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch {
      // Cancelled or not allowed: fall back to saving the file.
    }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
