import { Box, Typography } from '@mui/material';
import * as React from 'react';
import EmbroideryMark from '../EmbroideryMark/EmbroideryMark.tsx';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

/** Placeholder for pages and lists with nothing to show yet, set like a blank page in a book. */
const EmptyState = ({ title, description, action }: EmptyStateProps) => {
  return (
    <Box sx={{
      py: { xs: 6, md: 8 }, px: 3, textAlign: 'center',
      borderTop: 1, borderBottom: 1, borderColor: 'divider'
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2.5, opacity: 0.85 }}>
        <EmbroideryMark size={40} weight={1.4}/>
      </Box>
      <Typography variant='h4' component='h2' sx={{ mb: 1 }}>{title}</Typography>
      {description && (
        <Typography color='text.secondary' sx={{ maxWidth: 460, mx: 'auto', mb: action ? 3 : 0 }}>
          {description}
        </Typography>
      )}
      {action}
    </Box>
  );
};

export default EmptyState;
