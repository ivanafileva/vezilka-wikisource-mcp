import { Box } from '@mui/material';
import { useCallback, useRef } from 'react';
import * as React from 'react';
import StitchCanvas, { type BuildStitches } from '../../../embroidery/StitchCanvas.tsx';
import { buildHero } from '../../../embroidery/crossStitchPattern.ts';
import { fullBleedSx } from '../../layout/styles.ts';

/** Rows of plain fabric kept between the top border and the first medallions. */
const TOP_ROWS = 2;

/**
 * The home hero: a full-width piece of embroidered fabric, after Macedonian
 * cross-stitch charts, continuing straight on from the top border's grid,
 * with the hero text (children) on an unstitched area.
 */
const CrossStitchHero = ({ children }: { children: React.ReactNode }) => {
  const textRef = useRef<HTMLDivElement>(null);
  /** How far (in stitches) the text is currently shifted to sit centred in its empty space. */
  const shiftRef = useRef(0);

  const build = useCallback<BuildStitches>((cols, rows, cellRectOf, cell) => {
    const text = textRef.current;
    if (!text) {
      return buildHero(cols, rows, null, TOP_ROWS).stitches;
    }
    // Work from the text's unshifted position, so shifting it never changes the pattern.
    const t = cellRectOf(text);
    const s = shiftRef.current;
    const base = { x0: t.x0 - s, y0: t.y0, x1: t.x1 - s, y1: t.y1 };
    const { stitches, gap } = buildHero(cols, rows, { x0: base.x0 - 3, y0: base.y0 - 2, x1: base.x1 + 3, y1: base.y1 + 2 }, TOP_ROWS);

    // Centre the text in the empty space between the nearest motifs, keeping
    // it at least two stitches from either page edge.
    const centred = Math.round((gap.x0 + gap.x1) / 2 - (base.x0 + base.x1) / 2);
    const shift = Math.max(2 - base.x0, Math.min(centred, cols - 3 - base.x1));
    shiftRef.current = shift;
    text.style.transform = shift ? `translateX(${shift * cell}px)` : '';
    return stitches;
  }, []);

  return (
    <Box component='section' sx={{
      // Pulled up past the main padding, so the fabric continues straight on from the top border.
      ...fullBleedSx, position: 'relative', mt: { xs: -3, md: -5 },
      // The text starts near the top, so all of it fits on the first screen.
      display: 'flex', alignItems: 'flex-start',
      minHeight: { md: 640 }, pt: { xs: '32px', md: '40px' },
      pb: { xs: '330px', md: '150px' }
    }}>
      <StitchCanvas build={build} watch={textRef}/>
      {/* Same column as the rest of the page: page padding, then a centred 1280px column. */}
      <Box sx={{ position: 'relative', width: '100%', px: { xs: 2, sm: 3, md: 5 } }}>
        <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
          {/* fit-content: the box hugs the visible text, so centring uses its real edges. */}
          <Box ref={textRef} sx={{ maxWidth: 600, width: 'fit-content' }}>
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default CrossStitchHero;
