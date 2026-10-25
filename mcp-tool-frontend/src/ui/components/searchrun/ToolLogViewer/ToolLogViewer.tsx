import { Box, Typography } from '@mui/material';
import type { ToolInvocationLogResponse } from '../../../../api/types/toolLog.ts';
import { MONO_FONT } from '../../../../theme/theme.ts';
import { formatDateTime } from '../../../format.ts';

interface ToolLogViewerProps {
  logs: ToolInvocationLogResponse[];
}

/**
 * Renders the MCP tool-invocation trace as a timeline — one entry per tool
 * call, with its name, arguments, result summary, success marker and
 * timestamp. Provided as the reference for a live-log view.
 */
const ToolLogViewer = ({ logs }: ToolLogViewerProps) => {
  if (logs.length === 0) {
    return (
      <Typography color='text.secondary'>
        Сè уште нема запишани повици на алатки.
      </Typography>
    );
  }

  return (
    <Box component='ol' sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {logs.map((log, index) => (
        <Box component='li' key={log.id} sx={{ display: 'grid', gridTemplateColumns: '20px minmax(0, 1fr)', columnGap: 1.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: '7px' }}>
            <Box sx={{
              width: 9, height: 9, borderRadius: '50%', flexShrink: 0, border: 2,
              borderColor: log.successful ? 'success.main' : 'error.main', bgcolor: 'background.paper'
            }}/>
            {index < logs.length - 1 && <Box sx={{ flex: 1, width: '1px', bgcolor: 'divider', mt: 0.5 }}/>}
          </Box>
          <Box sx={{ pb: 2.5, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 1.5 }}>
              <Typography variant='body2' sx={{ fontFamily: MONO_FONT, fontWeight: 600 }}>{log.toolName}</Typography>
              <Typography variant='caption' color='text.tertiary'>
                {formatDateTime(log.occurredAt)}
              </Typography>
            </Box>
            {log.arguments && (
              <Typography variant='caption' component='div' sx={{ fontFamily: MONO_FONT, color: 'text.secondary', wordBreak: 'break-word', mt: 0.25 }}>
                {log.arguments}
              </Typography>
            )}
            {log.resultSummary && (
              <Typography variant='body2' color='text.secondary' sx={{ wordBreak: 'break-word', mt: 0.5 }}>
                {log.resultSummary}
              </Typography>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default ToolLogViewer;
