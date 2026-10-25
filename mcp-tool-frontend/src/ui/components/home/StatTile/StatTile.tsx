import { Box, Typography } from '@mui/material';
import * as React from 'react';
import { Link } from 'react-router';
import { formatNumber } from '../../../format.ts';

interface StatTileProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  to: string;
}

/** One cell of the corpus ledger: a large serif figure over a small label. */
const StatTile = ({ label, value, icon, to }: StatTileProps) => {
  return (
    <Box
      component={Link}
      to={to}
      sx={{
        display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%', py: 2.5, px: { xs: 0, sm: 2.5 },
        color: 'text.primary', transition: 'background-color 140ms ease',
        '&:hover': { bgcolor: 'action.hover' },
        '&:hover .stat-icon': { color: 'primary.main' }
      }}
    >
      <Box className='stat-icon' sx={{ color: 'text.disabled', display: 'flex', '& svg': { fontSize: 18 }, transition: 'color 140ms ease' }}>
        {icon}
      </Box>
      <Typography variant='h2' component='div' sx={{ fontSize: '2.6rem', fontVariantNumeric: 'tabular-nums' }}>
        {formatNumber(value)}
      </Typography>
      <Typography variant='overline' color='text.tertiary' sx={{ lineHeight: 1.3 }}>{label}</Typography>
    </Box>
  );
};

export default StatTile;
