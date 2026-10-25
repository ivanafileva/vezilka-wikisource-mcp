import { useTheme } from '@mui/material';

interface EmbroideryMarkProps {
  size?: number;
  /** Stroke width in viewBox units; thinner reads better at large sizes. */
  weight?: number;
}

/**
 * The app logo: a diamond of cross-stitches, a motif found on Macedonian
 * embroidered costumes, in ink with a red centre.
 */
const EmbroideryMark = ({ size = 32, weight = 1.8 }: EmbroideryMarkProps) => {
  const theme = useTheme();
  const ink = theme.palette.text.primary;
  const red = theme.palette.primary.main;

  // Cells of a 5x5 grid forming a diamond; the centre is red.
  const cells: [number, number][] = [
    [2, 0], [1, 1], [3, 1], [0, 2], [4, 2], [1, 3], [3, 3], [2, 4], [2, 2]
  ];

  return (
    <svg width={size} height={size} viewBox='0 0 30 30' role='img' aria-label='Везилка'>
      {cells.map(([cx, cy]) => {
        const x = 1 + cx * 6;
        const y = 1 + cy * 6;
        const color = cx === 2 && cy === 2 ? red : ink;
        return (
          <path
            key={`${cx}-${cy}`}
            d={`M${x} ${y}l4 4M${x + 4} ${y}l-4 4`}
            stroke={color}
            strokeWidth={weight}
            strokeLinecap='round'
          />
        );
      })}
    </svg>
  );
};

export default EmbroideryMark;
