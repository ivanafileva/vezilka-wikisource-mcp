import { alpha, type PaletteMode, type Theme } from '@mui/material/styles';
import { stitchCell } from './crossStitchPattern.ts';

/** Colours of the fabric grid: a fine line per stitch, a stronger one every ten. */
export const fabricColors = (ink: string, mode: PaletteMode) => ({
  grid: alpha(ink, mode === 'light' ? 0.05 : 0.07),
  gridMajor: alpha(ink, mode === 'light' ? 0.1 : 0.13)
});

/**
 * The squared embroidery fabric as a CSS background with `cell`-px stitches.
 * Lines start at the element's top-left corner.
 */
export const fabricBackground = (ink: string, mode: PaletteMode, cell: number) => {
  const { grid, gridMajor } = fabricColors(ink, mode);
  const major = `${cell * 10}px ${cell * 10}px`;
  const minor = `${cell}px ${cell}px`;
  return {
    backgroundImage: [
      `linear-gradient(to right, ${gridMajor} 1px, transparent 1px)`,
      `linear-gradient(to bottom, ${gridMajor} 1px, transparent 1px)`,
      `linear-gradient(to right, ${grid} 1px, transparent 1px)`,
      `linear-gradient(to bottom, ${grid} 1px, transparent 1px)`
    ].join(', '),
    backgroundSize: `${major}, ${major}, ${minor}, ${minor}`
  };
};

/** The fabric grid for an element, at the stitch size of each breakpoint (used by the frosted header). */
export const fabricGridSx = (theme: Theme) => {
  const ink = theme.palette.text.primary;
  const mode = theme.palette.mode;
  return {
    backgroundImage: fabricBackground(ink, mode, stitchCell(0)).backgroundImage,
    backgroundSize: {
      xs: fabricBackground(ink, mode, stitchCell(0)).backgroundSize,
      md: fabricBackground(ink, mode, stitchCell(900)).backgroundSize
    }
  };
};
