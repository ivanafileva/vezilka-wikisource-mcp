import { MONO_FONT } from '../../../theme/theme.ts';

/** A small square, outlined icon button, as used in the masthead. */
export const boxedIconSx = {
  width: 34, height: 34, border: 1, borderColor: 'divider', bgcolor: 'background.paper',
  '&:hover': { borderColor: 'text.disabled', bgcolor: 'background.paper' }
} as const;

/** Inline code / pre block on the sunk surface. */
export const codeSx = {
  fontFamily: MONO_FONT, fontSize: 12.5, lineHeight: 1.6, p: 1.5, m: 0, borderRadius: '8px', overflowX: 'auto',
  bgcolor: 'background.sunk', border: 1, borderColor: 'divider', color: 'text.primary'
} as const;

/** Height of the header bar, in px: a whole number of stitches (8px / 10px), so the fabric grid runs on seamlessly below it. */
export const HEADER_HEIGHT = { xs: 64, md: 80 } as const;

/** Horizontal page padding shared by the header, main area and footer. */
export const pageGutterSx = {
  px: { xs: 2, sm: 3, md: 5 }
} as const;

/**
 * Lets an element inside the (centred) main column run the full width of the
 * window. The layout clips the horizontal overflow that 100vw would otherwise
 * cause next to a scrollbar.
 */
export const fullBleedSx = {
  width: '100vw',
  ml: 'calc(50% - 50vw)'
} as const;

/** Zero-padded index like "007", used in overlines ("RUN 007"). */
export const pad = (n: number, width = 3) => String(n).padStart(width, '0');
