import {
  Alert, Box, Button, Checkbox, CircularProgress, Collapse, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useEffect, useMemo, useState } from 'react';
import type { CreateDonationBatchRequest } from '../../../../api/types/donation.ts';
import type { ResourceFilter } from '../../../../api/types/resource.ts';
import useResources from '../../../../hooks/useResources.ts';
import ConfidenceChip from '../../resource/ConfidenceChip/ConfidenceChip.tsx';
import { HEADING_FONT } from '../../../../theme/theme.ts';
import { words } from '../../../format.ts';

interface SubmitDonationDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: CreateDonationBatchRequest) => Promise<boolean>;
}

const AVAILABLE: ResourceFilter = { donated: false };
const PAGE_SIZE = 50;

/**
 * "Create donation batch": pick not-yet-donated resources, review their text,
 * and create a DRAFT batch. Low-confidence texts are flagged so only clearly
 * Macedonian content is donated.
 */
const SubmitDonationDialog = ({ open, onClose, onCreate }: SubmitDonationDialogProps) => {
  const { resources, loading, refresh } = useResources(AVAILABLE, 0, PAGE_SIZE);

  const [selected, setSelected] = useState<number[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setSelected([]);
      setExpanded(null);
      void refresh();
    }
  }, [open, refresh]);

  const available = useMemo(() => resources?.content ?? [], [resources]);
  const lowConfidenceSelected = available.some(
    (r) => selected.includes(r.id) && (r.macedonianConfidence ?? 0) < 0.5
  );

  const toggle = (id: number) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      if (await onCreate({ resourceIds: selected })) {
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='md'>
      <DialogTitle>Нов пакет за донација</DialogTitle>
      <DialogContent dividers>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
          Изберете текстови од Викизвор што сè уште не се дел од пакет. Секој текст се донира на
          doniraj.vezilka.ai заедно со изворната адреса.
        </Typography>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress/>
          </Box>
        )}
        {!loading && available.length === 0 && (
          <Typography color='text.secondary' sx={{ my: 2 }}>
            Нема преостанати текстови за донирање. Прво направете пребарување.
          </Typography>
        )}
        {!loading && available.length > 0 && (
          <List dense>
            {available.map((resource) => (
              <Box key={resource.id}>
                <ListItem
                  disablePadding
                  secondaryAction={
                    <IconButton edge='end' onClick={() => setExpanded(expanded === resource.id ? null : resource.id)}>
                      {expanded === resource.id ? <ExpandLessIcon/> : <ExpandMoreIcon/>}
                    </IconButton>
                  }
                >
                  <ListItemButton onClick={() => toggle(resource.id)}>
                    <ListItemIcon>
                      <Checkbox edge='start' checked={selected.includes(resource.id)} tabIndex={-1} disableRipple/>
                    </ListItemIcon>
                    <ListItemText
                      primary={resource.title ?? `Текст #${resource.id}`}
                      secondary={words(resource.wordCount ?? 0)}
                    />
                    <ConfidenceChip confidence={resource.macedonianConfidence}/>
                  </ListItemButton>
                </ListItem>
                <Collapse in={expanded === resource.id} unmountOnExit>
                  <Typography
                    variant='body2'
                    sx={{ whiteSpace: 'pre-line', maxHeight: 220, overflow: 'auto', mx: 7, mb: 1, p: 1.5, bgcolor: 'background.sunk', borderRadius: 2, fontFamily: HEADING_FONT, lineHeight: 1.7 }}
                  >
                    {resource.content}
                  </Typography>
                </Collapse>
              </Box>
            ))}
          </List>
        )}
        {lowConfidenceSelected && (
          <Alert severity='warning' sx={{ mt: 1 }}>
            Некои од избраните текстови имаат ниска сигурност дека се на македонски. Прегледајте ги пред да ги донирате.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Откажи</Button>
        <Button variant='contained' onClick={handleCreate} disabled={selected.length === 0 || saving}>
          Создај пакет ({selected.length})
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubmitDonationDialog;
