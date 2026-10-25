import { Box, Button, Card, CardActions, CardContent, Link, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import SendIcon from '@mui/icons-material/Send';
import ReplayIcon from '@mui/icons-material/Replay';
import { Link as RouterLink } from 'react-router';
import type { DonationBatchResponse } from '../../../../api/types/donation.ts';
import StatusLabel from '../../layout/StatusLabel/StatusLabel.tsx';
import { donationStatusTone } from '../../layout/StatusLabel/statusTones.ts';
import { pad } from '../../layout/styles.ts';
import { MONO_FONT } from '../../../../theme/theme.ts';
import { donationStatusLabel, formatDateTime, texts } from '../../../format.ts';

interface DonationBatchCardProps {
  batch: DonationBatchResponse;
  busy?: boolean;
  onApprove?: (id: number) => void;
  onSubmit?: (id: number) => void;
}

/**
 * One donation batch: its resources, status, the Vezilka reference(s) once
 * submitted, and the approve / submit actions allowed in the current status.
 */
const DonationBatchCard = ({ batch, busy = false, onApprove, onSubmit }: DonationBatchCardProps) => {
  const references = (batch.vezilkaReference ?? '').split(',').map((ref) => ref.trim()).filter(Boolean);
  const hasActions = (batch.status === 'DRAFT' && onApprove) || ((batch.status === 'APPROVED' || batch.status === 'FAILED') && onSubmit);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant='overline' color='text.tertiary' sx={{ lineHeight: 1 }}>Пакет {pad(batch.id)}</Typography>
          <StatusLabel label={donationStatusLabel[batch.status]} tone={donationStatusTone[batch.status]}/>
        </Box>
        <Typography variant='h4' component='h2' sx={{ fontSize: '1.75rem' }}>
          {texts(batch.resourceCount)}
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ flexGrow: 1 }}>
          {batch.resourceIds.map((id, index) => (
            <span key={id}>
              {index > 0 && ', '}
              <Link component={RouterLink} to={`/resources/${id}`}>#{id}</Link>
            </span>
          ))}
        </Typography>
        {references.length > 0 && (
          <Box>
            <Typography variant='overline' color='text.tertiary' sx={{ display: 'block' }}>Референца од Везилка</Typography>
            {references.map((ref) => (
              <Typography key={ref} variant='caption' sx={{ display: 'block', fontFamily: MONO_FONT, wordBreak: 'break-all' }}>
                {ref}
              </Typography>
            ))}
          </Box>
        )}
        <Typography variant='caption' color='text.tertiary'>
          Создаден: {formatDateTime(batch.createdAt)}
          {batch.submittedAt && ` · испратен: ${formatDateTime(batch.submittedAt)}`}
        </Typography>
      </CardContent>
      {hasActions && (
        <CardActions>
          {batch.status === 'DRAFT' && onApprove && (
            <Button size='small' variant='outlined' startIcon={<CheckIcon/>} disabled={busy} onClick={() => onApprove(batch.id)}>
              Одобри
            </Button>
          )}
          {batch.status === 'APPROVED' && onSubmit && (
            <Button size='small' variant='contained' startIcon={<SendIcon/>} disabled={busy}
                    onClick={() => onSubmit(batch.id)}>
              Испрати на Везилка
            </Button>
          )}
          {batch.status === 'FAILED' && onSubmit && (
            <Button size='small' variant='outlined' startIcon={<ReplayIcon/>} disabled={busy}
                    onClick={() => onSubmit(batch.id)}>
              Испрати повторно
            </Button>
          )}
        </CardActions>
      )}
    </Card>
  );
};

export default DonationBatchCard;
