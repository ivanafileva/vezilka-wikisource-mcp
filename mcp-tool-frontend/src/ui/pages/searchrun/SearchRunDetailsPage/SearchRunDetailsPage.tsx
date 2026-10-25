import { Box, CircularProgress, Link, Typography } from '@mui/material';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import ConfidenceChip from '../../../components/resource/ConfidenceChip/ConfidenceChip.tsx';
import { useParams } from 'react-router';
import useSearchRunDetails from '../../../../hooks/useSearchRunDetails.ts';
import ToolLogViewer from '../../../components/searchrun/ToolLogViewer/ToolLogViewer.tsx';
import PageHeader from '../../../components/layout/PageHeader/PageHeader.tsx';
import StatusLabel from '../../../components/layout/StatusLabel/StatusLabel.tsx';
import { searchStatusTone } from '../../../components/layout/StatusLabel/statusTones.ts';
import { pad } from '../../../components/layout/styles.ts';
import { Link as RouterLink } from 'react-router';
import { HEADING_FONT } from '../../../../theme/theme.ts';
import { searchStatusLabel, texts, words } from '../../../format.ts';

/** Shows Cyrillic instead of %D0%9A... in page URLs. */
const readableUrl = (url: string) => {
  try {
    return decodeURI(url);
  } catch {
    return url;
  }
};

/**
 * One search run in detail: its status, the resources it produced, and the
 * live MCP tool-invocation trace. Provided as the reference for a detail page.
 */
const SearchRunDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { searchRun, resources, logs, loading } = useSearchRunDetails(id!);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress size={28}/>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        overline={`Пребарување ${pad(Number(id))} — Пребарај`}
        title={searchRun ? `„${searchRun.query}“` : `Пребарување #${id}`}
        actions={searchRun && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <StatusLabel label={searchStatusLabel[searchRun.status]} tone={searchStatusTone[searchRun.status]}/>
            <Typography variant='body2' color='text.secondary'>{texts(searchRun.resultCount ?? 0)}</Typography>
          </Box>
        )}
      />

      <Box sx={{
        display: 'grid', gap: { xs: 5, md: 6 }, alignItems: 'start',
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1.4fr) minmax(0, 1fr)' }
      }}>
        <Box component='section'>
          <Typography variant='overline' color='text.tertiary' sx={{ display: 'block', pb: 1, borderBottom: 1, borderColor: 'text.primary' }}>
            Текстови
          </Typography>
          {resources.length === 0 && (
            <Typography color='text.secondary' sx={{ py: 2 }}>Ова пребарување нема текстови.</Typography>
          )}
          <Box component='ol' sx={{ listStyle: 'none', m: 0, p: 0 }}>
            {resources.map((resource, index) => (
              <Box component='li' key={resource.id} sx={{
                display: 'grid', gridTemplateColumns: '32px minmax(0, 1fr) auto', alignItems: 'center', columnGap: 1.5,
                py: 1.75, borderBottom: 1, borderColor: 'divider'
              }}>
                <Typography variant='caption' color='text.disabled' sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {String(index + 1).padStart(2, '0')}
                </Typography>
                <Box sx={{ minWidth: 0 }}>
                  <Link
                    component={RouterLink}
                    to={`/resources/${resource.id}`}
                    underline='hover'
                    sx={{ fontFamily: HEADING_FONT, fontSize: '1.1rem', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', mb: 0.25 }}
                  >
                    {resource.title ?? `Текст #${resource.id}`}
                  </Link>
                  {resource.sourceUrl && (
                    <Link
                      href={resource.sourceUrl}
                      target='_blank'
                      rel='noreferrer'
                      variant='caption'
                      underline='none'
                      title={readableUrl(resource.sourceUrl)}
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, color: 'text.tertiary' }}
                    >
                      <Box component='span' sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {readableUrl(resource.sourceUrl)}
                      </Box>
                      <NorthEastIcon sx={{ fontSize: 12, flexShrink: 0 }}/>
                    </Link>
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                  {resource.wordCount != null && (
                    <Typography variant='caption' color='text.tertiary' sx={{ display: { xs: 'none', sm: 'block' } }}>
                      {words(resource.wordCount)}
                    </Typography>
                  )}
                  <ConfidenceChip confidence={resource.macedonianConfidence}/>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        <Box component='section'>
          <Typography variant='overline' color='text.tertiary' sx={{ display: 'block', pb: 1, mb: 2.5, borderBottom: 1, borderColor: 'text.primary' }}>
            Трага на MCP алатките
          </Typography>
          <ToolLogViewer logs={logs}/>
        </Box>
      </Box>
    </Box>
  );
};

export default SearchRunDetailsPage;
