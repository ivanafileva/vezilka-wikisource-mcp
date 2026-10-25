import { Box, Grid, IconButton, Tooltip, Typography } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import useSnackbar from '../../../../hooks/useSnackbar.ts';
import { codeSx } from '../../layout/styles.ts';

const API_URL: string = import.meta.env.VITE_BASE_API_URL ?? 'http://localhost:8080/api';
export const SSE_URL = `${API_URL.replace(/\/api\/?$/, '')}/sse`;

const CLAUDE_CONFIG = JSON.stringify({
  mcpServers: { vezilka: { command: 'npx', args: ['-y', 'mcp-remote', SSE_URL] } }
}, null, 2);

/** How to connect an MCP client (Inspector, Claude Desktop, the Vezilka agent) to this server. */
const McpConnectCard = () => {
  const { showSnackbar } = useSnackbar();

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showSnackbar(`${what}: копирано.`, 'success');
    } catch {
      showSnackbar('Нема пристап до привремената меморија.', 'error');
    }
  };

  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper', p: { xs: 2.5, md: 4 } }}>
      <Grid container spacing={{ xs: 3, md: 5 }}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Typography variant='overline' color='text.tertiary' sx={{ display: 'block', mb: 1.5 }}>
            Model Context Protocol
          </Typography>
          <Typography variant='h3' sx={{ fontSize: '2rem', mb: 1.5 }}>Поврзете AI агент</Typography>
          <Typography variant='body2' color='text.secondary'>
            Истите алатки се достапни и преку MCP (HTTP + SSE). Насочете ги MCP Inspector, Claude Desktop или
            агентот на Везилка кон оваа адреса.
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <CopyLabel label='SSE крајна точка' onCopy={() => copy(SSE_URL, 'MCP адреса')}/>
            <Box component='code' sx={{ ...codeSx, display: 'block' }}>{SSE_URL}</Box>
          </Box>
          <Box>
            <CopyLabel label='claude_desktop_config.json' onCopy={() => copy(CLAUDE_CONFIG, 'Конфигурација')}/>
            <Box component='pre' sx={codeSx}>{CLAUDE_CONFIG}</Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

const CopyLabel = ({ label, onCopy }: { label: string; onCopy: () => void }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
    <Typography variant='overline' color='text.tertiary'>{label}</Typography>
    <Tooltip title='Копирај'>
      <IconButton size='small' onClick={onCopy} aria-label={`Копирај ${label}`}>
        <ContentCopyIcon sx={{ fontSize: 15 }}/>
      </IconButton>
    </Tooltip>
  </Box>
);

export default McpConnectCard;
