import { Box, Typography } from '@mui/material';
import * as React from 'react';
import { MONO_FONT } from '../../../../theme/theme.ts';

interface StepCardProps {
  step: number;
  total?: number;
  title: string;
  description: string;
  tool: string;
  icon: React.ReactNode;
}

/** One step of the Search -> Analyze -> Donate flow, set as a column under a hairline, with the MCP tool that performs it. */
const StepCard = ({ step, total = 3, title, description, tool, icon }: StepCardProps) => {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 1.5, pt: 2.5, borderTop: 1, borderColor: 'text.primary' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant='overline' color='text.tertiary' sx={{ lineHeight: 1 }}>
          Чекор 0{step} / 0{total}
        </Typography>
        <Box sx={{ color: 'text.disabled', display: 'flex', '& svg': { fontSize: 18 } }}>{icon}</Box>
      </Box>
      <Typography variant='h3' component='h3' sx={{ fontSize: '2rem' }}>{title}</Typography>
      <Typography variant='body2' color='text.secondary' sx={{ flexGrow: 1 }}>{description}</Typography>
      <Typography variant='caption' sx={{ fontFamily: MONO_FONT, color: 'primary.main' }}>
        → {tool}
      </Typography>
    </Box>
  );
};

export default StepCard;
