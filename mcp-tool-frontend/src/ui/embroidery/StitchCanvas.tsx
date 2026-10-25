import { Box, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useEffect, useRef } from 'react';
import * as React from 'react';
import { stitchCell, type CellRect, type Stitch, type ThreadColor } from './crossStitchPattern.ts';

/** Delay between the two half-stitches of one cross ("/" then "\"). */
const SECOND_HALF_MS = 140;

/**
 * One clock for all embroidery on the page, started on first draw, so the
 * top border and the hero are sewn as a single wave. It survives re-renders
 * (resize, theme change, fonts loading), which then draw what is already sewn.
 */
let sewingStart: number | null = null;

interface Palette {
  threads: Record<ThreadColor, string>;
  shadow: string;
  sheen: string;
}

/** One half of a cross stitch in cell (x, y): a thread with a soft shadow and a little sheen. */
const drawHalf = (ctx: CanvasRenderingContext2D, s: Stitch, half: 0 | 1, cell: number, p: Palette) => {
  const inset = cell * 0.17;
  const x0 = s.x * cell + inset;
  const x1 = (s.x + 1) * cell - inset;
  const [y0, y1] = half === 0
    ? [(s.y + 1) * cell - inset, s.y * cell + inset]
    : [s.y * cell + inset, (s.y + 1) * cell - inset];
  const line = (dx: number, dy: number, width: number, color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x0 + dx, y0 + dy);
    ctx.lineTo(x1 + dx, y1 + dy);
    ctx.stroke();
  };
  const width = cell * 0.3;
  line(0.5, 0.7, width, p.shadow);
  line(0, 0, width, p.threads[s.color]);
  line(-0.3, -0.3, width * 0.32, p.sheen);
};

/** Builds the stitches for a cols x rows grid of `cell`-px stitches; `cellRectOf` maps an element to grid cells. */
export type BuildStitches = (cols: number, rows: number, cellRectOf: (el: Element) => CellRect, cell: number) => Stitch[];

interface StitchCanvasProps {
  /** Produces the stitches for the grid; must be stable (module-level or useCallback). */
  build: BuildStitches;
  /** Another element whose size or position affects the pattern (e.g. text to stitch around). */
  watch?: React.RefObject<HTMLElement | null>;
}

/**
 * A canvas filling its (positioned) parent with cross stitches, on the page's fabric grid (the body background). On first
 * load the stitches are sewn one by one, each cross as "/" then "\"; later
 * redraws show the finished state. Respects reduced motion.
 */
const StitchCanvas = ({ build, watch }: StitchCanvasProps) => {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) {
      return;
    }
    const watched = watch?.current ?? null;

    const light = theme.palette.mode === 'light';
    const ink = theme.palette.text.primary;
    const palette: Palette = {
      threads: { red: theme.palette.primary.main, lightRed: alpha(theme.palette.primary.main, 0.5), ink },
      shadow: light ? 'rgba(60, 40, 20, 0.22)' : 'rgba(0, 0, 0, 0.55)',
      sheen: light ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.16)'
    };
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    let frame = 0;
    let lastKey = '';
    const layoutKey = () => {
      const b = canvas.getBoundingClientRect();
      const parts = [b.left, b.width, b.height, window.innerWidth >= 900 ? 1 : 0];
      if (watched) {
        const t = watched.getBoundingClientRect();
        parts.push(t.left - b.left, t.top - b.top, t.width, t.height);
      }
      return parts.map(Math.round).join(',');
    };

    const render = () => {
      cancelAnimationFrame(frame);
      lastKey = layoutKey();
      const box = canvas.getBoundingClientRect();
      const width = Math.round(box.width);
      const height = Math.round(box.height);

      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = 'round';

      // Columns are counted from the left edge of the page, not of this canvas
      // (a full-bleed canvas can start a few px off-screen, under the
      // scrollbar's share of 100vw), so every canvas and the header share one grid.
      const cell = stitchCell(window.innerWidth);
      const cellRectOf = (el: Element): CellRect => {
        const r = el.getBoundingClientRect();
        return {
          x0: Math.floor(r.left / cell),
          y0: Math.floor((r.top - box.top) / cell),
          x1: Math.ceil(r.right / cell),
          y1: Math.ceil((r.bottom - box.top) / cell)
        };
      };
      const stitches = build(Math.ceil(box.right / cell), Math.floor(height / cell), cellRectOf, cell);

      ctx.clearRect(0, 0, width, height);
      ctx.translate(-box.left, 0);

      if (sewingStart === null) {
        sewingStart = reducedMotion ? -Infinity : performance.now();
      }
      const start = sewingStart;
      let first = 0;
      let second = 0;
      const step = (now: number) => {
        const elapsed = now - start;
        while (first < stitches.length && stitches[first].at <= elapsed) {
          drawHalf(ctx, stitches[first++], 0, cell, palette);
        }
        while (second < first && stitches[second].at + SECOND_HALF_MS <= elapsed) {
          drawHalf(ctx, stitches[second++], 1, cell, palette);
        }
        if (second < stitches.length) {
          frame = requestAnimationFrame(step);
        }
      };
      step(performance.now());
    };

    render();
    const observer = new ResizeObserver(() => {
      if (layoutKey() !== lastKey) {
        render();
      }
    });
    observer.observe(canvas);
    if (watched) {
      observer.observe(watched);
    }

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [theme, build, watch]);

  return <Box component='canvas' ref={canvasRef} aria-hidden sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}/>;
};

export default StitchCanvas;
