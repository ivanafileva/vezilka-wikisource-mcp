/**
 * Generates Macedonian cross-stitch patterns on a grid of cells, after
 * traditional embroidery charts: interlocking diamond medallions with curls,
 * small black connecting diamonds, and zigzag borders with a checkered fill.
 */

export type ThreadColor = 'red' | 'lightRed' | 'ink';

export interface Stitch {
  x: number;
  y: number;
  color: ThreadColor;
  /** When (ms after sewing starts) the first half-stitch is sewn. */
  at: number;
}

/** A rectangle of cells to leave unstitched (where text sits). */
export interface CellRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const MEDALLION_RADIUS = 8;
const LATTICE_X = 20;
const LATTICE_Y = 16;
/** Zigzag period, in cells: half the medallion spacing, so every medallion sits under a zigzag low point. */
const ZIGZAG_PERIOD = LATTICE_X / 2;
const BAND_HEIGHT = ZIGZAG_PERIOD / 2 + 5;

/** Rows of the zigzag border at the top of every page: just the band, starting on its first row. */
export const BORDER_ROWS = BAND_HEIGHT;

/** Height of the top border in px at each breakpoint (BORDER_ROWS stitches of 8px or 10px). */
export const BORDER_HEIGHT = { xs: BORDER_ROWS * 8, md: BORDER_ROWS * 10 } as const;

/** Size of one stitch in px; decided by the window width so all embroidery on a page shares one grid. */
export const stitchCell = (windowWidth: number) => (windowWidth >= 900 ? 10 : 8);

/** Curl cells in one quadrant (|dx|, |dy|); mirrored into all four. */
const CURL_RED = new Set(['4,3', '5,3', '6,4', '6,5', '5,6', '4,6', '3,5']);
const CURL_INK = new Set(['5,5', '7,7']);

/**
 * One medallion cell at offset (dx, dy) from its centre: a black-outlined
 * red diamond in the middle, a thick red ring, curls on the four faces and
 * black tips on the axes.
 */
const medallionCell = (dx: number, dy: number): ThreadColor | null => {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  const d = ax + ay;
  if (d === 0 || d === 3) return 'ink';
  if (d === 1 || d === 2 || d === 5 || d === 6) return 'red';
  if ((ax === 0 || ay === 0) && d === 7) return 'red';
  if ((ax === 0 || ay === 0) && d === 8) return 'ink';
  const key = `${ax},${ay}`;
  if (CURL_RED.has(key)) return 'red';
  if (CURL_INK.has(key)) return 'ink';
  return null;
};

/** The small connecting diamond between medallions. */
const connectorCell = (dx: number, dy: number): ThreadColor | null => {
  const d = Math.abs(dx) + Math.abs(dy);
  return d === 0 ? 'red' : d === 1 ? 'ink' : null;
};

/**
 * A zigzag band row: two black zigzags with a checkered light-red fill
 * between. The low points fall on columns that are multiples of ZIGZAG_PERIOD.
 */
const bandCell = (x: number, row: number): ThreadColor | null => {
  const half = ZIGZAG_PERIOD / 2;
  const tri = Math.abs((((x % ZIGZAG_PERIOD) + ZIGZAG_PERIOD) % ZIGZAG_PERIOD) - half);
  const offset = row - tri;
  if (offset === 0 || offset === 4) return 'ink';
  if (offset > 0 && offset < 4 && (x + row) % 2 === 0) return 'lightRed';
  return null;
};

/** Deterministic pseudo-random jitter in [0, 1) per cell, so re-renders match. */
const jitter = (x: number, y: number) => (((x * 73856093) ^ (y * 19349663)) >>> 0) % 1000 / 1000;

const inside = (r: CellRect, x: number, y: number) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;

const intersects = (r: CellRect, x0: number, y0: number, x1: number, y1: number) =>
  x0 <= r.x1 && x1 >= r.x0 && y0 <= r.y1 && y1 >= r.y0;

/** Collects stitches into a grid, ignoring cells outside it. */
const grid = (cols: number, rows: number) => {
  const cells = new Map<string, Stitch>();
  const put = (x: number, y: number, color: ThreadColor | null) => {
    if (color && x >= 0 && x < cols && y >= 0 && y < rows) {
      cells.set(`${x},${y}`, { x, y, color, at: 0 });
    }
  };
  return { cells, put };
};

const band = (put: (x: number, y: number, c: ThreadColor | null) => void, cols: number, y0: number, avoid: CellRect | null) => {
  for (let row = 0; row < BAND_HEIGHT; row++) {
    for (let x = 0; x < cols; x++) {
      if (!avoid || !inside(avoid, x, y0 + row)) {
        put(x, y0 + row, bandCell(x, row));
      }
    }
  }
};

/**
 * Gives every stitch a start time so the embroidery is sewn in one wave
 * spreading out from (ox, oy), with a little hand-made irregularity.
 * Sorted by start time.
 */
const sewFrom = (cells: Map<string, Stitch>, ox: number, oy: number) => {
  const stitches = [...cells.values()];
  for (const s of stitches) {
    s.at = 150 + Math.hypot(s.x - ox, (s.y - oy) * 1.4) * 26 + jitter(s.x, s.y) * 320;
  }
  return stitches.sort((a, b) => a.at - b.at);
};

/** The zigzag border along the top of every page. */
export const buildBorder = (cols: number): Stitch[] => {
  const { cells, put } = grid(cols, BORDER_ROWS);
  band(put, cols, 0, null);
  // The wave's origin sits in the hero below, so the border is sewn as part of the same wave.
  return sewFrom(cells, cols * 0.7, BORDER_ROWS + 40);
};

/**
 * The home hero's embroidery for a cols x rows grid: interlocking medallions
 * above a zigzag border at the bottom. The top `reserveTop` rows stay free
 * and motifs covering `avoid` are skipped. Also returns the columns of the
 * empty space left around `avoid` (between the nearest motifs on either side,
 * or the edges), so the text can be centred in it.
 */
export const buildHero = (cols: number, rows: number, avoid: CellRect | null, reserveTop: number) => {
  const { cells, put } = grid(cols, rows);
  let gapX0 = 0;
  let gapX1 = cols - 1;
  /** Narrows the empty span with a kept motif spanning columns x0..x1 and rows y0..y1. */
  const bound = (x0: number, y0: number, x1: number, y1: number) => {
    if (avoid && y1 >= avoid.y0 && y0 <= avoid.y1) {
      if (x1 < avoid.x0) gapX0 = Math.max(gapX0, x1 + 1);
      if (x0 > avoid.x1) gapX1 = Math.min(gapX1, x0 - 1);
    }
  };
  const bottomBand = rows - BAND_HEIGHT - 1;
  band(put, cols, bottomBand, avoid);

  // Medallion rows are anchored to the bottom border and stacked upwards, so
  // there is never an empty gap above the bottom border. Columns are
  // multiples of ten, under the zigzag low points of the top border.
  const r = MEDALLION_RADIUS;
  const topRow: number[] = [];
  let topCy = -1;
  for (let j = 0, cy = bottomBand - r - 1; cy - r >= reserveTop; j++, cy -= LATTICE_Y) {
    const shift = j % 2 === 0 ? 0 : LATTICE_X / 2;
    topRow.length = 0;
    topCy = cy;
    for (let cx = shift - LATTICE_X; cx < cols + LATTICE_X; cx += LATTICE_X) {
      if (!avoid || !intersects(avoid, cx - r, cy - r, cx + r, cy + r)) {
        topRow.push(cx);
        bound(cx - r, cy - r, cx + r, cy + r);
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            put(cx + dx, cy + dy, medallionCell(dx, dy));
          }
        }
      }
      const kx = cx + LATTICE_X / 2;
      if (!avoid || !intersects(avoid, kx - 1, cy - 1, kx + 1, cy + 1)) {
        bound(kx - 1, cy - 1, kx + 1, cy + 1);
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            put(kx + dx, cy + dy, connectorCell(dx, dy));
          }
        }
      }
    }
  }

  // Whatever room is left above the top row is bridged by chains hanging each
  // medallion from the border's zigzag above, so the pattern is one piece.
  // A chain that would cross the text is left out rather than cut into pieces.
  for (const cx of topRow) {
    if (avoid && intersects(avoid, cx, 0, cx, topCy - r - 1)) {
      continue;
    }
    for (let y = 0; y < topCy - r; y++) {
      put(cx, y, y % 2 === 0 ? 'ink' : 'red');
    }
  }

  return { stitches: sewFrom(cells, cols * 0.7, rows * 0.5), gap: { x0: gapX0, x1: gapX1 } };
};
