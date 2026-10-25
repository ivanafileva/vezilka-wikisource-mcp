import { Box, Button, CircularProgress, Link, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import { Link as RouterLink, useNavigate, useParams } from 'react-router';
import useResourceDetails from '../../../../hooks/useResourceDetails.ts';
import ResourceAnalysisPanel from '../../../components/resource/ResourceAnalysisPanel/ResourceAnalysisPanel.tsx';
import ConfidenceChip from '../../../components/resource/ConfidenceChip/ConfidenceChip.tsx';
import { pad } from '../../../components/layout/styles.ts';
import { HEADING_FONT } from '../../../../theme/theme.ts';
import { formatDateTime, words } from '../../../format.ts';

const readableUrl = (url: string) => {
  try {
    return decodeURI(url);
  } catch {
    return url;
  }
};

/**
 * One resource in full, set like an article: the complete text in a reading
 * column, provenance in the byline, and analysis and donation in a side column.
 */
const ResourceDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { resource, loading, working, onAnalyze, onCreateDonation } = useResourceDetails(id!);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress size={28}/>
      </Box>
    );
  }

  if (!resource) {
    return (
      <Box>
        <Typography variant='h3' component='h1' gutterBottom>Текст #{id}</Typography>
        <Typography color='text.secondary'>Овој текст не постои или е избришан.</Typography>
      </Box>
    );
  }

  const handleDonate = async () => {
    const batch = await onCreateDonation();
    if (batch) {
      navigate('/donations');
    }
  };

  return (
    <Box>
      <Button variant='outlined' size='small' startIcon={<ArrowBackIcon/>} onClick={() => navigate(-1)} sx={{ mb: { xs: 3, md: 4 } }}>
        Назад
      </Button>

      <Box component='header' sx={{ mb: { xs: 4, md: 6 }, maxWidth: 760 }}>
        <Typography variant='overline' color='text.tertiary' sx={{ display: 'block', mb: 2 }}>
          Текст {pad(resource.id)} — Викизвор
        </Typography>
        <Typography variant='h1' sx={{ fontSize: { xs: '2.4rem', md: '3.5rem' }, mb: 2.5, wordBreak: 'break-word' }}>
          {resource.title ?? `Текст #${resource.id}`}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 1, rowGap: 1, color: 'text.tertiary' }}>
          <ConfidenceChip confidence={resource.macedonianConfidence}/>
          <Typography variant='body2' color='inherit'>
            {resource.wordCount != null && `${words(resource.wordCount)} · `}
            {resource.language && `јазик: ${resource.language} · `}
            од <Link component={RouterLink} to={`/search-runs/${resource.searchRunId}`}>пребарување #{resource.searchRunId}</Link>
            {' · '}
            {resource.donationBatchId != null
              ? <Link component={RouterLink} to='/donations'>во пакет за донација #{resource.donationBatchId}</Link>
              : 'не е дониран'}
          </Typography>
        </Box>
      </Box>

      <Box sx={{
        display: 'grid', gap: { xs: 4, md: 6 }, alignItems: 'start',
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1fr) 320px' }
      }}>
        <Box component='article'>
          <Typography sx={{
            whiteSpace: 'pre-line', fontFamily: HEADING_FONT, fontSize: { xs: '1.05rem', md: '1.15rem' },
            lineHeight: 1.8, maxWidth: '62ch', color: 'text.primary'
          }}>
            {resource.content}
          </Typography>
          <Box sx={{ mt: 5, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            {resource.sourceUrl && (
              <Link href={resource.sourceUrl} target='_blank' rel='noreferrer' variant='body2'
                    sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, wordBreak: 'break-all' }}>
                {readableUrl(resource.sourceUrl)} <NorthEastIcon sx={{ fontSize: 14 }}/>
              </Link>
            )}
            {resource.fetchedAt && (
              <Typography variant='caption' color='text.tertiary' sx={{ display: 'block', mt: 0.5 }}>
                Преземено: {formatDateTime(resource.fetchedAt)}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <ResourceAnalysisPanel
            analysis={resource.analysis}
            wordCount={resource.wordCount}
            analyzing={working}
            onAnalyze={onAnalyze}
          />
          <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper', p: 2.5 }}>
            <Typography variant='overline' color='text.tertiary' sx={{ display: 'block', mb: 1 }}>Донирај на Везилка</Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
              Создава нацрт-пакет за донација со овој текст. Одобрете го и испратете го на страницата Донации.
            </Typography>
            <Button
              fullWidth
              variant='contained'
              startIcon={<VolunteerActivismIcon/>}
              disabled={working || resource.donationBatchId != null}
              onClick={handleDonate}
            >
              Додај во пакет за донација
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ResourceDetailsPage;
