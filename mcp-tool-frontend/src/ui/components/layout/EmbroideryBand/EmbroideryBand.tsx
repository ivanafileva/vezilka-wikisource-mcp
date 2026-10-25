import { Box, useTheme } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

interface EmbroideryBandProps {
  height?: number;
  sx?: SxProps<Theme>;
}

/** One cross-stitch "X" of size s at (x, y). */
const stitch = (x: number, y: number, s: number, color: string) =>
  `<path d='M${x} ${y}l${s} ${s}M${x + s} ${y}l-${s} ${s}' stroke='${color}' stroke-width='1' stroke-linecap='round'/>`;

/**
 * A quiet section rule made of cross-stitches, after Macedonian folk
 * embroidery (везилка = embroiderer): a hairline of ink-coloured stitches with
 * a small red diamond every few centimetres. Pure SVG as a CSS background, so
 * it scales and costs no requests.
 */
const EmbroideryBand = ({ height = 12, sx }: EmbroideryBandProps) => {
  const theme = useTheme();
  const ink = theme.palette.divider;
  const red = theme.palette.primary.main;

  // A 96px tile: a row of small stitches, then a diamond of four red ones.
  const row = [0, 8, 16, 24, 32, 40, 48, 56].map((x) => stitch(x + 2, 4.5, 3, ink)).join('');
  const diamond = stitch(72, 1, 3, red) + stitch(68, 4.5, 3, red) + stitch(76, 4.5, 3, red) + stitch(72, 8, 3, red);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='12' viewBox='0 0 96 12'>${row}${diamond}</svg>`;

  return (
    <Box
      aria-hidden
      sx={{
        height,
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
        backgroundRepeat: 'repeat-x',
        backgroundPosition: 'left center',
        backgroundSize: `${(96 * height) / 12}px ${height}px`,
        ...sx
      }}
    />
  );
};

export default EmbroideryBand;
