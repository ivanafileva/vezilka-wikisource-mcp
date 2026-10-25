import { Box, Button, Card, CardActions, CardContent, IconButton, Link, Tooltip, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import InsightsIcon from '@mui/icons-material/Insights';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import { Link as RouterLink, useNavigate } from 'react-router';
import type { ResourceResponse } from '../../../../api/types/resource.ts';
import ConfidenceChip from '../ConfidenceChip/ConfidenceChip.tsx';
import StatusLabel from '../../layout/StatusLabel/StatusLabel.tsx';
import { pad } from '../../layout/styles.ts';
import { HEADING_FONT } from '../../../../theme/theme.ts';
import { words } from '../../../format.ts';

interface ResourceCardProps {
  resource: ResourceResponse;
  busy?: boolean;
  onAnalyze?: (id: number) => void;
  onDelete?: (id: number) => void;
}

const PREVIEW_LENGTH = 200;

/**
 * One collected Wikisource text: title, a content preview, the source link,
 * the Macedonian-language confidence and its analysis/donation state, with
 * details / analyze / delete actions.
 */
const ResourceCard = ({ resource, busy = false, onAnalyze, onDelete }: ResourceCardProps) => {
  const navigate = useNavigate();

  const preview = (resource.content ?? '').replace(/\s+/g, ' ').trim();

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
          <Typography variant='overline' color='text.tertiary' sx={{ lineHeight: 1 }}>
            Текст {pad(resource.id)}
          </Typography>
          <ConfidenceChip confidence={resource.macedonianConfidence}/>
        </Box>
        <Link component={RouterLink} to={`/resources/${resource.id}`} underline='none'
              sx={{ fontFamily: HEADING_FONT, fontSize: '1.35rem', lineHeight: 1.2, letterSpacing: '-0.01em', color: 'text.primary' }}>
          {resource.title ?? `Текст #${resource.id}`}
        </Link>
        <Typography variant='body2' color='text.secondary' sx={{ flexGrow: 1, fontFamily: HEADING_FONT, fontSize: '0.92rem', lineHeight: 1.65 }}>
          {preview.length > PREVIEW_LENGTH ? `${preview.slice(0, PREVIEW_LENGTH)}…` : preview}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
          {resource.wordCount != null && (
            <Typography variant='caption' color='text.tertiary'>{words(resource.wordCount)}</Typography>
          )}
          {resource.analysis && <StatusLabel label='Анализиран' tone='info'/>}
          {resource.donationBatchId != null && <StatusLabel label={`Пакет ${pad(resource.donationBatchId)}`} tone='primary'/>}
          {resource.sourceUrl && (
            <Link href={resource.sourceUrl} target='_blank' rel='noreferrer' variant='caption' color='text.tertiary'
                  sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, ml: 'auto' }}>
              Викизвор <NorthEastIcon sx={{ fontSize: 12 }}/>
            </Link>
          )}
        </Box>
      </CardContent>
      <CardActions>
        {onAnalyze && (
          <Button size='small' startIcon={<InsightsIcon/>} disabled={busy} onClick={() => onAnalyze(resource.id)}>
            {resource.analysis ? 'Повторно анализирај' : 'Анализирај'}
          </Button>
        )}
        {onDelete && (
          <Tooltip title={resource.donationBatchId != null ? 'Веќе е во пакет за донација' : 'Избриши'}>
            <span>
              <IconButton
                size='small'
                disabled={busy || resource.donationBatchId != null}
                onClick={() => onDelete(resource.id)}
                sx={{ '&:hover': { color: 'error.main' } }}
              >
                <DeleteOutlineIcon fontSize='small'/>
              </IconButton>
            </span>
          </Tooltip>
        )}
        <Button size='small' endIcon={<ArrowForwardIcon/>} onClick={() => navigate(`/resources/${resource.id}`)} sx={{ ml: 'auto' }}>
          Читај
        </Button>
      </CardActions>
    </Card>
  );
};

export default ResourceCard;
