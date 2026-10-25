import {
  Alert, Box, Button, CircularProgress, Grid, List, ListItemButton, ListItemText,
  Paper, TextField, Typography
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useMemo, useState } from 'react';
import useMcpTools from '../../../../hooks/useMcpTools.ts';
import type { InvokeToolResponse } from '../../../../api/types/mcp.ts';
import useSnackbar from '../../../../hooks/useSnackbar.ts';
import PageHeader from '../../../components/layout/PageHeader/PageHeader.tsx';
import StatusLabel from '../../../components/layout/StatusLabel/StatusLabel.tsx';
import { codeSx } from '../../../components/layout/styles.ts';
import { MONO_FONT } from '../../../../theme/theme.ts';

/** Example arguments pre-filled when a tool is selected. */
const EXAMPLE_ARGS: Record<string, unknown> = {
  search_resources: { query: 'Рацин', limit: 5 },
  list_search_results: { searchRunId: 1 },
  get_resource: { id: 1 },
  analyze_resource: { id: 1 },
  donate_resource: { id: 1 },
  corpus_stats: {}
};

const prettyJson = (text: string | null) => {
  if (!text) {
    return '';
  }
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
};

/**
 * The MCP playground: pick a tool the server exposes, inspect its JSON Schema,
 * provide arguments as JSON and invoke it — exactly what an MCP agent such as
 * the Vezilka host does. Fully provided. The provided `corpus_stats` tool works
 * out of the box; the others report "not implemented" until you build them.
 */
const McpPlaygroundPage = () => {
  const { tools, loading, invoking, invoke } = useMcpTools();
  const { showSnackbar } = useSnackbar();

  const [selected, setSelected] = useState<string | null>(null);
  const [args, setArgs] = useState<string>('{}');
  const [response, setResponse] = useState<InvokeToolResponse | null>(null);

  const selectedTool = useMemo(() => tools.find((t) => t.name === selected) ?? null, [tools, selected]);

  const prettySchema = useMemo(() => {
    if (!selectedTool) {
      return '';
    }
    try {
      return JSON.stringify(JSON.parse(selectedTool.inputSchema), null, 2);
    } catch {
      return selectedTool.inputSchema;
    }
  }, [selectedTool]);

  const handleSelect = (name: string) => {
    setSelected(name);
    setArgs(JSON.stringify(EXAMPLE_ARGS[name] ?? {}, null, 2));
    setResponse(null);
  };

  const handleInvoke = async () => {
    if (!selectedTool) {
      return;
    }
    let parsed: Record<string, unknown>;
    try {
      parsed = args.trim() ? JSON.parse(args) : {};
    } catch {
      showSnackbar('Аргументите мора да бидат валиден JSON.', 'error');
      return;
    }
    const result = await invoke(selectedTool.name, parsed);
    if (result) {
      setResponse(result);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress/>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        overline='Model Context Protocol — Алатки'
        title='MCP алатки'
        subtitle='Алатките што овој сервер ги нуди преку MCP. Изберете една за да ја видите JSON шемата што ја гледа агентот, а потоа повикајте ја вистинската алатка со примерни аргументи.'
      />
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper variant='outlined' sx={{ overflow: 'hidden' }}>
            <List disablePadding>
              {tools.map((tool) => (
                <ListItemButton
                  key={tool.name}
                  selected={tool.name === selected}
                  onClick={() => handleSelect(tool.name)}
                >
                  <ListItemText
                    primary={tool.name}
                    secondary={tool.description}
                    slotProps={{
                      primary: { sx: { fontFamily: MONO_FONT, fontWeight: 600, fontSize: '0.85rem' } },
                      secondary: { sx: { fontSize: '0.78rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } }
                    }}
                  />
                </ListItemButton>
              ))}
              {tools.length === 0 && (
                <Box sx={{ p: 2 }}>
                  <Typography color='text.secondary'>Нема регистрирани алатки.</Typography>
                </Box>
              )}
            </List>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          {selectedTool ? (
            <Paper variant='outlined' sx={{ p: { xs: 2.5, md: 3 }, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box>
                <Typography variant='overline' color='text.tertiary' sx={{ display: 'block' }}>Алатка</Typography>
                <Typography variant='h5' sx={{ fontFamily: MONO_FONT, fontSize: '1.3rem', mb: 0.5 }}>{selectedTool.name}</Typography>
                <Typography variant='body2' color='text.secondary'>{selectedTool.description}</Typography>
              </Box>
              <Box>
                <Typography variant='overline' color='text.tertiary' sx={{ display: 'block', mb: 0.5 }}>Влезна шема</Typography>
                <Box component='pre' sx={codeSx}>
                  {prettySchema}
                </Box>
              </Box>
              <TextField
                label='Аргументи (JSON)'
                value={args}
                onChange={(e) => setArgs(e.target.value)}
                multiline
                minRows={3}
                fullWidth
                slotProps={{ htmlInput: { style: { fontFamily: MONO_FONT, fontSize: 13 } } }}
              />
              <Box>
                <Button
                  variant='contained'
                  startIcon={<PlayArrowIcon/>}
                  onClick={handleInvoke}
                  disabled={invoking}
                >
                  Повикај
                </Button>
              </Box>
              {response && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant='overline' color='text.tertiary'>Резултат</Typography>
                    <StatusLabel label={response.successful ? 'Успешно' : 'Грешка'} tone={response.successful ? 'success' : 'error'}/>
                  </Box>
                  {response.successful ? (
                    <Box component='pre' sx={{ ...codeSx, overflow: 'auto', maxHeight: 480 }}>
                      {prettyJson(response.result)}
                    </Box>
                  ) : (
                    <Alert severity='warning'>{response.error}</Alert>
                  )}
                </Box>
              )}
            </Paper>
          ) : (
            <Paper variant='outlined' sx={{ p: 4, borderStyle: 'dashed', bgcolor: 'transparent', textAlign: 'center' }}>
              <Typography color='text.secondary'>Изберете алатка за да ја прегледате и повикате.</Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default McpPlaygroundPage;
