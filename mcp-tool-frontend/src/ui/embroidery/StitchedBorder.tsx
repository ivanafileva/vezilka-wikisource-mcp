import { Box } from '@mui/material';
import StitchCanvas, { type BuildStitches } from './StitchCanvas.tsx';
import { BORDER_HEIGHT, buildBorder } from './crossStitchPattern.ts';

const build: BuildStitches = (cols) => buildBorder(cols);

/**
 * The zigzag cross-stitch border every page starts with, edge to edge. It is
 * tucked up under the empty bottom of the transparent header (by whole
 * stitches, so the grid stays aligned), so the zigzag begins right below the
 * header's buttons.
 */
const StitchedBorder = () => (
  <Box sx={{ position: 'relative', height: BORDER_HEIGHT, mt: { xs: '-8px', md: '-20px' } }}>
    <StitchCanvas build={build}/>
  </Box>
);

export default StitchedBorder;
