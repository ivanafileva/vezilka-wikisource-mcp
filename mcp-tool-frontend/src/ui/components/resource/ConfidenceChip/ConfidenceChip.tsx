import { Box, Tooltip, Typography } from '@mui/material';

interface ConfidenceChipProps {
  confidence: number | null;
}

const SEGMENTS = 5;

/** "МК 92%" with a small five-segment meter, coloured by how confidently the text is Macedonian. */
const ConfidenceChip = ({ confidence }: ConfidenceChipProps) => {
  const tone = confidence == null ? 'text.disabled'
    : confidence >= 0.8 ? 'success.main' : confidence >= 0.5 ? 'warning.main' : 'error.main';
  const filled = confidence == null ? 0 : Math.max(1, Math.round(confidence * SEGMENTS));

  return (
    <Tooltip title='Сигурност дека текстот е на македонски'>
      <Box sx={{
        display: 'inline-flex', alignItems: 'center', gap: 0.75, height: 22, px: 0.875,
        border: 1, borderColor: 'divider', borderRadius: '6px', bgcolor: 'background.paper', flexShrink: 0
      }}>
        <Typography variant='caption' sx={{ fontWeight: 600, fontSize: '0.68rem', letterSpacing: '0.08em', color: 'text.tertiary' }}>
          МК
        </Typography>
        <Box sx={{ display: 'flex', gap: '2px' }}>
          {Array.from({ length: SEGMENTS }, (_, i) => (
            <Box key={i} sx={{ width: 4, height: 8, borderRadius: '1px', bgcolor: i < filled ? tone : 'divider' }}/>
          ))}
        </Box>
        <Typography variant='caption' sx={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: 'text.primary' }}>
          {confidence == null ? '?' : `${(confidence * 100).toFixed(0)}%`}
        </Typography>
      </Box>
    </Tooltip>
  );
};

export default ConfidenceChip;
