import { Box, Link, Typography } from '@mui/material';
import { pageGutterSx } from '../styles.ts';
import EmbroideryBand from '../EmbroideryBand/EmbroideryBand.tsx';

const Footer = () => {
  return (
    <Box component='footer'>
      <EmbroideryBand height={10}/>
      <Box sx={pageGutterSx}>
        <Box sx={{
          py: 3, display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'space-between', alignItems: 'baseline'
        }}>
          <Typography variant='caption' color='text.tertiary'>
            Текстови од{' '}
            <Link href='https://mk.wikisource.org' target='_blank' rel='noreferrer'>Викизвор</Link>
            {' '}(јавен домен / CC BY-SA) · донирани на{' '}
            <Link href='https://doniraj.vezilka.ai' target='_blank' rel='noreferrer'>doniraj.vezilka.ai</Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Footer;
