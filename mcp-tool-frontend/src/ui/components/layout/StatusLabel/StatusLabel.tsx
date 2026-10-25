import { Box, Typography } from '@mui/material';

export type StatusTone = 'default' | 'info' | 'primary' | 'success' | 'warning' | 'error';

interface StatusLabelProps {
  label: string;
  tone?: StatusTone;
}

/** A status as a coloured dot and a small tracked label, quieter than a filled chip. */
const StatusLabel = ({ label, tone = 'default' }: StatusLabelProps) => {
  const color = tone === 'default' ? 'text.disabled' : `${tone}.main`;

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color }}/>
      <Typography variant='overline' sx={{ lineHeight: 1, color: tone === 'default' ? 'text.tertiary' : color }}>
        {label}
      </Typography>
    </Box>
  );
};

export default StatusLabel;
