import {
  Box, FormControl, InputLabel, MenuItem, Paper, Select, Slider, TextField, ToggleButton, ToggleButtonGroup, Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import type { ResourceFilter } from '../../../../api/types/resource.ts';
import useSearchRunOptions from '../../../../hooks/useSearchRunOptions.ts';

interface ResourceFiltersProps {
  filter: ResourceFilter;
  onChange: (filter: ResourceFilter) => void;
}

type TriState = 'any' | 'yes' | 'no';

const toTriState = (value: boolean | undefined): TriState => (value === undefined ? 'any' : value ? 'yes' : 'no');
const fromTriState = (value: TriState): boolean | undefined => (value === 'any' ? undefined : value === 'yes');

/**
 * Filter bar for the resource browser: search run, minimum Macedonian
 * confidence, analyzed yes/no, donated yes/no and a (debounced) free-text
 * search over the title and content.
 */
const ResourceFilters = ({ filter, onChange }: ResourceFiltersProps) => {
  const { searchRuns } = useSearchRunOptions();

  const [search, setSearch] = useState<string>(filter.search ?? '');
  const [confidence, setConfidence] = useState<number>(Math.round((filter.minMacedonianConfidence ?? 0) * 100));

  // Debounce the free-text search so we do not query on every keystroke.
  useEffect(() => {
    const trimmed = search.trim();
    if ((filter.search ?? '') === trimmed) {
      return;
    }
    const timeout = setTimeout(() => onChange({ ...filter, search: trimmed || undefined }), 400);
    return () => clearTimeout(timeout);
  }, [search, filter, onChange]);

  return (
    <Paper variant='outlined' sx={{ p: 2, mb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <TextField
          label='Пребарај наслов или текст'
          size='small'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 220, flexGrow: 1 }}
        />

        <FormControl size='small' sx={{ minWidth: 240 }}>
          <InputLabel id='search-run-filter'>Пребарување</InputLabel>
          <Select
            labelId='search-run-filter'
            label='Пребарување'
            value={filter.searchRunId != null ? String(filter.searchRunId) : ''}
            onChange={(e) => onChange({
              ...filter,
              searchRunId: e.target.value === '' ? undefined : Number(e.target.value)
            })}
          >
            <MenuItem value=''><em>Сите пребарувања</em></MenuItem>
            {searchRuns.map((run) => (
              <MenuItem key={run.id} value={String(run.id)}>#{run.id} „{run.query}“</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 4, rowGap: 2, alignItems: 'flex-end' }}>
        <Box sx={{ width: 240, px: 1 }}>
          <Typography variant='overline' color='text.tertiary' sx={{ lineHeight: 1.4 }}>
            Мин. сигурност МК · {confidence}%
          </Typography>
          <Slider
            size='small'
            value={confidence}
            step={5}
            min={0}
            max={100}
            onChange={(_, value) => setConfidence(value as number)}
            onChangeCommitted={(_, value) => onChange({
              ...filter,
              minMacedonianConfidence: (value as number) === 0 ? undefined : (value as number) / 100
            })}
          />
        </Box>

        <Box>
          <Typography variant='overline' color='text.tertiary' sx={{ display: 'block', lineHeight: 1.4 }}>Анализирани</Typography>
          <ToggleButtonGroup
            size='small'
            exclusive
            value={toTriState(filter.analyzed)}
            onChange={(_, value: TriState | null) => value && onChange({ ...filter, analyzed: fromTriState(value) })}
          >
            <ToggleButton value='any'>Сите</ToggleButton>
            <ToggleButton value='yes'>Да</ToggleButton>
            <ToggleButton value='no'>Не</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box>
          <Typography variant='overline' color='text.tertiary' sx={{ display: 'block', lineHeight: 1.4 }}>Донирани</Typography>
          <ToggleButtonGroup
            size='small'
            exclusive
            value={toTriState(filter.donated)}
            onChange={(_, value: TriState | null) => value && onChange({ ...filter, donated: fromTriState(value) })}
          >
            <ToggleButton value='any'>Сите</ToggleButton>
            <ToggleButton value='yes'>Да</ToggleButton>
            <ToggleButton value='no'>Не</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>
    </Paper>
  );
};

export default ResourceFilters;
