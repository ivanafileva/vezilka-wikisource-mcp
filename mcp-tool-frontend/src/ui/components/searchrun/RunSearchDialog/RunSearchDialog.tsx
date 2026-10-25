import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography
} from '@mui/material';
import { useState } from 'react';
import useSearchRuns from '../../../../hooks/useSearchRuns.ts';

interface RunSearchDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * The "run a search" form — part of the fully-worked reference slice. It calls
 * useSearchRuns().onRun, which triggers the same work the `search_resources`
 * MCP tool does on the backend.
 */
const SUGGESTIONS = ['Рацин', 'народни песни', 'Миладиновци', 'Охрид', 'Прличев', 'Крсте Мисирков'];

const RunSearchDialog = ({ open, onClose }: RunSearchDialogProps) => {
  const { onRun } = useSearchRuns();

  const [query, setQuery] = useState<string>('');
  const [limit, setLimit] = useState<string>('10');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleClose = () => {
    setQuery('');
    setLimit('10');
    onClose();
  };

  const handleSubmit = async () => {
    if (!query.trim()) {
      return;
    }
    setSubmitting(true);
    try {
      const parsedLimit = Number(limit);
      await onRun({ query: query.trim(), limit: Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : undefined });
      handleClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth='sm'>
      <DialogTitle>Пребарај го македонскиот Викизвор</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label='Барање'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            fullWidth
            autoFocus
            required
            placeholder='на пр. Рацин'
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                void handleSubmit();
              }
            }}
          />
          <Box>
            <Typography variant='overline' color='text.tertiary'>Пробајте</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 0.5 }}>
              {SUGGESTIONS.map((suggestion) => (
                <Chip key={suggestion} label={suggestion} size='small' variant='outlined' clickable
                      onClick={() => setQuery(suggestion)}/>
              ))}
            </Box>
          </Box>
          <TextField
            label='Најмногу резултати'
            type='number'
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            fullWidth
            helperText='До 25 текстови по пребарување (за да не ги оптоваруваме серверите на Викимедија).'
            slotProps={{ htmlInput: { min: 1, max: 25 } }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Откажи</Button>
        <Button variant='contained' onClick={handleSubmit} disabled={!query.trim() || submitting}>
          {submitting ? 'Се пребарува…' : 'Пребарај'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RunSearchDialog;
