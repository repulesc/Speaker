/**
 * Maps room metres to drawing pixels and back. A frame fits a world rectangle (metres) into a
 * viewport (pixels) with margins for labels, keeping the aspect ratio and centring the result.
 */
export interface Margins {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface Frame {
  scale: number;
  ox: number;
  oy: number;
}

export function fitFrame(
  width: number,
  height: number,
  worldW: number,
  worldH: number,
  margins: Margins,
): Frame {
  const scale = Math.max(
    1,
    Math.min(
      (width - margins.left - margins.right) / worldW,
      (height - margins.top - margins.bottom) / worldH,
    ),
  );
  return {
    scale,
    ox: margins.left + Math.max(0, (width - margins.left - margins.right - worldW * scale) / 2),
    oy: margins.top + Math.max(0, (height - margins.top - margins.bottom - worldH * scale) / 2),
  };
}

export const toPx = (frame: Frame, a: number, b: number) => ({
  x: frame.ox + a * frame.scale,
  y: frame.oy + b * frame.scale,
});

export const toWorld = (frame: Frame, px: number, py: number) => ({
  a: (px - frame.ox) / frame.scale,
  b: (py - frame.oy) / frame.scale,
});
