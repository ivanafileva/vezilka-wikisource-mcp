import { Box, Button, Card, CardActions, CardContent, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router';
import type { SearchRunResponse } from '../../../../api/types/searchRun.ts';
import StatusLabel from '../../layout/StatusLabel/StatusLabel.tsx';
import { searchStatusTone } from '../../layout/StatusLabel/statusTones.ts';
import { pad } from '../../layout/styles.ts';
import { formatDateTime, searchStatusLabel } from '../../../format.ts';

interface SearchRunCardProps {
  searchRun: SearchRunResponse;
}

const duration = (run: SearchRunResponse) => {
  if (!run.startedAt || !run.finishedAt) {
    return null;
  }
  const seconds = (new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000;
  return seconds < 60 ? `${seconds.toFixed(1).replace('.', ',')} с` : `${Math.round(seconds / 60)} мин`;
};

const SearchRunCard = ({ searchRun }: SearchRunCardProps) => {
  const navigate = useNavigate();
  const took = duration(searchRun);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
          <Typography variant='overline' color='text.tertiary' sx={{ lineHeight: 1 }}>Пребарување {pad(searchRun.id)}</Typography>
          <StatusLabel label={searchStatusLabel[searchRun.status]} tone={searchStatusTone[searchRun.status]}/>
        </Box>
        <Typography variant='h4' component='h2' sx={{ fontSize: '1.75rem', wordBreak: 'break-word', flexGrow: 1 }}>
          „{searchRun.query}“
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography sx={{ fontFamily: 'inherit', fontSize: '1.5rem', fontWeight: 500, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {searchRun.resultCount ?? 0}
          </Typography>
          <Typography variant='body2' color='text.secondary'>{searchRun.resultCount === 1 ? 'собран текст' : 'собрани текстови'}</Typography>
        </Box>
        <Typography variant='caption' color='text.tertiary'>
          {formatDateTime(searchRun.createdAt)}{took && ` · ${took}`}
        </Typography>
      </CardContent>
      <CardActions>
        <Button size='small' onClick={() => navigate(`/resources?searchRunId=${searchRun.id}`)}>
          Прегледај текстови
        </Button>
        <Button size='small' endIcon={<ArrowForwardIcon/>} onClick={() => navigate(`/search-runs/${searchRun.id}`)}
                sx={{ ml: 'auto' }}>
          Детали
        </Button>
      </CardActions>
    </Card>
  );
};

export default SearchRunCard;
