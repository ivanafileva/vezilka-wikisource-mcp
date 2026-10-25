import { Box, Button, Container, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import * as React from 'react';
import { Link } from 'react-router';
import EmbroideryBand from '../../layout/EmbroideryBand/EmbroideryBand.tsx';
import EmbroideryMark from '../../layout/EmbroideryMark/EmbroideryMark.tsx';
import { HEADING_FONT } from '../../../../theme/theme.ts';
import StitchedBorder from '../../../embroidery/StitchedBorder.tsx';

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

/** Full-page layout used by the login and register forms: an editorial title on the left, the form on the right. */
const AuthCard = ({ title, subtitle, children }: AuthCardProps) => {
  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Container maxWidth='lg' sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2.5 }}>
        <Box component={Link} to='/' sx={{ display: 'flex', alignItems: 'center', gap: 1.25, color: 'text.primary' }}>
          <EmbroideryMark size={26}/>
          <Typography sx={{ fontFamily: HEADING_FONT, fontSize: '1.3rem', letterSpacing: '-0.02em' }}>Везилка</Typography>
        </Box>
        <Button component={Link} to='/' variant='outlined' size='small' startIcon={<ArrowBackIcon/>}>
          Почетна
        </Button>
      </Container>
      <StitchedBorder/>

      <Container maxWidth='lg' sx={{
        flex: 1, display: 'grid', alignItems: 'center', gap: { xs: 4, md: 8 }, py: { xs: 3, md: 6 },
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1.1fr) minmax(0, 1fr)' }
      }}>
        <Box>
          <Typography variant='overline' color='text.tertiary' sx={{ display: 'block', mb: 2 }}>
            Викизвор → Везилка
          </Typography>
          <Typography variant='h1' sx={{ fontSize: { xs: '2.75rem', md: '4rem' }, mb: 2.5 }}>{title}</Typography>
          <Typography color='text.secondary' sx={{ fontSize: '1.1rem', maxWidth: 440 }}>{subtitle}</Typography>
          <EmbroideryBand height={12} sx={{ mt: 5, maxWidth: 320, display: { xs: 'none', md: 'block' } }}/>
        </Box>
        <Box sx={{
          border: 1, borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper',
          p: { xs: 3, sm: 4 }, width: '100%', maxWidth: 460, justifySelf: { md: 'end' }
        }}>
          {children}
        </Box>
      </Container>
    </Box>
  );
};

export default AuthCard;
