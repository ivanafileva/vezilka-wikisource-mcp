import { Box, Button, CircularProgress, Pagination } from '@mui/material';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import { Link, useSearchParams } from 'react-router';
import { useCallback, useState } from 'react';
import type { ResourceFilter } from '../../../../api/types/resource.ts';
import useResources from '../../../../hooks/useResources.ts';
import ResourceFilters from '../../../components/resource/ResourceFilters/ResourceFilters.tsx';
import ResourceGrid from '../../../components/resource/ResourceGrid/ResourceGrid.tsx';
import PageHeader from '../../../components/layout/PageHeader/PageHeader.tsx';
import EmptyState from '../../../components/layout/EmptyState/EmptyState.tsx';
import { texts } from '../../../format.ts';

const PAGE_SIZE = 12;

/** The collected-resource browser: filters, a paged grid and per-resource actions. */
const ResourcesPage = () => {
  const [searchParams] = useSearchParams();
  const initialRun = Number(searchParams.get('searchRunId'));
  const [filter, setFilter] = useState<ResourceFilter>(
    Number.isFinite(initialRun) && initialRun > 0 ? { searchRunId: initialRun } : {}
  );
  const [page, setPage] = useState<number>(0);

  const { resources, loading, busyId, onDelete, onAnalyze } = useResources(filter, page, PAGE_SIZE);

  const handleFilterChange = useCallback((next: ResourceFilter) => {
    setFilter(next);
    setPage(0);
  }, []);

  return (
    <Box>
      <PageHeader
        overline='02 / 03 — Анализирај'
        title='Текстови'
        subtitle={resources
          ? `${texts(resources.totalElements)} собрани од mk.wikisource.org. Анализирајте ги за да добиете клучни зборови, резиме и статистика.`
          : 'Текстови собрани од mk.wikisource.org.'}
      />
      <ResourceFilters filter={filter} onChange={handleFilterChange}/>
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress/>
        </Box>
      )}
      {!loading && (!resources || resources.content.length === 0) && (
        <EmptyState
          icon={<MenuBookOutlinedIcon/>}
          title='Нема текстови што одговараат'
          description='Прво направете пребарување или олабавете ги филтрите.'
          action={<Button variant='outlined' component={Link} to='/search-runs'>Кон пребарување</Button>}
        />
      )}
      {!loading && resources && resources.content.length > 0 && (
        <>
          <ResourceGrid resources={resources.content} busyId={busyId} onAnalyze={onAnalyze} onDelete={onDelete}/>
          {resources.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={resources.totalPages}
                page={page + 1}
                onChange={(_, value) => setPage(value - 1)}
                shape='rounded'
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default ResourcesPage;
