import { Box, Button, CircularProgress, Grid } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import { useState } from 'react';
import useSearchRuns from '../../../../hooks/useSearchRuns.ts';
import SearchRunCard from '../../../components/searchrun/SearchRunCard/SearchRunCard.tsx';
import RunSearchDialog from '../../../components/searchrun/RunSearchDialog/RunSearchDialog.tsx';
import PageHeader from '../../../components/layout/PageHeader/PageHeader.tsx';
import EmptyState from '../../../components/layout/EmptyState/EmptyState.tsx';

/**
 * The search control panel. The data flow (useSearchRuns -> SearchRunCard)
 * and the "Run search" dialog are the reference pattern for the other features.
 */
const SearchRunsPage = () => {
  const { searchRuns, loading } = useSearchRuns();

  const [runDialogOpen, setRunDialogOpen] = useState<boolean>(false);

  return (
    <Box>
      <PageHeader
        overline='01 / 03 — Пребарај'
        title='Пребарувања'
        subtitle='Секое пребарување го пребарува mk.wikisource.org, ги презема пронајдените страници како чист текст и ги зачувува со оценка колку се македонски. Истото го прави и MCP алатката search_resources.'
        actions={
          <Button variant='contained' startIcon={<AddIcon/>} onClick={() => setRunDialogOpen(true)}>
            Ново пребарување
          </Button>
        }
      />
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress/>
        </Box>
      )}
      {!loading && searchRuns.length === 0 && (
        <EmptyState
          icon={<TravelExploreIcon/>}
          title='Сè уште нема пребарувања'
          description='Пребарајте го македонскиот Викизвор по автор, место или жанр, на пример „Рацин“, „Охрид“ или „народни песни“.'
          action={<Button variant='contained' onClick={() => setRunDialogOpen(true)}>Започни го првото пребарување</Button>}
        />
      )}
      {!loading && searchRuns.length > 0 && (
        <Grid container spacing={2.5}>
          {searchRuns.map((searchRun) => (
            <Grid key={searchRun.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <SearchRunCard searchRun={searchRun}/>
            </Grid>
          ))}
        </Grid>
      )}
      <RunSearchDialog
        open={runDialogOpen}
        onClose={() => setRunDialogOpen(false)}
      />
    </Box>
  );
};

export default SearchRunsPage;
