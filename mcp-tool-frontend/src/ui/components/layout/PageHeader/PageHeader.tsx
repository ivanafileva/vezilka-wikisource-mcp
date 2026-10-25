import { Box, Typography } from '@mui/material';
import * as React from 'react';

interface PageHeaderProps {
  title: string;
  overline?: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}

/** Editorial page title block: a tracked overline, a large serif title, a lede and actions on the right. */
const PageHeader = ({ title, overline, subtitle, actions }: PageHeaderProps) => {
  return (
    <Box sx={{
      display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'flex-end', justifyContent: 'space-between', mb: { xs: 4, md: 5 }
    }}>
      <Box sx={{ minWidth: 0, flex: '1 1 480px' }}>
        {overline && (
          <Typography variant='overline' color='text.tertiary' sx={{ display: 'block', mb: 1.5 }}>
            {overline}
          </Typography>
        )}
        <Typography variant='h2' component='h1' sx={{ fontSize: { xs: '2.25rem', md: '3.1rem' }, wordBreak: 'break-word' }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography color='text.secondary' sx={{ mt: 2, maxWidth: 620, fontSize: { md: '1.05rem' } }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>{actions}</Box>}
    </Box>
  );
};

export default PageHeader;
